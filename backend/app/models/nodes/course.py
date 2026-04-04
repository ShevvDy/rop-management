from collections import defaultdict
from typing import TYPE_CHECKING

from neomodel import (
    BooleanProperty,
    IntegerProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    StringProperty,
    AsyncZeroOrMore,
    AsyncZeroOrOne,
    AsyncOne, DoesNotExist,
)

from ..base_node import BaseNode
from ..enums import EducationForm
from ...exceptions import NotFoundException, BadRequestException, ConflictException
from ...utils.types import DictStrAny, CourseNodes, CourseEdge, CourseKey

if TYPE_CHECKING:
    from .cohort import Cohort


class Course(BaseNode):
    """Курс/Дисциплина"""

    course_id = IntegerProperty(unique_index=True)
    name = StringProperty(required=True)
    code = StringProperty(required=True, unique_index=True)
    semester_number = IntegerProperty(required=True)
    credits = IntegerProperty(required=True)
    form = StringProperty(default=EducationForm.offline, choices=EducationForm.choices())
    is_elective = BooleanProperty(default=False)
    syllabus_link = StringProperty()
    rpd_link = StringProperty()
    is_last = BooleanProperty(default=False)

    # Связи (исходящие)
    cohort_rel = AsyncRelationshipTo(
        ".cohort.Cohort",
        "PLANNED_FOR_COHORT",
        AsyncOne,
    )

    specialization_rel = AsyncRelationshipTo(
        ".specialization.Specialization",
        "FOR_SPECIALIZATION",
        AsyncZeroOrOne,
    )

    # Курсы, для которых этот курс является пререквизитом
    dependent_courses_rel = AsyncRelationshipTo(
        ".course.Course",
        "REQUIRES_PREREQUISITE",
        AsyncZeroOrMore,
    )

    # Теги курса
    tags_rel = AsyncRelationshipTo(
        ".tag.Tag",
        "HAS_TAG",
        AsyncZeroOrMore,
    )

    # Связи (входящие)
    # Пререквизиты - курсы, которые нужно пройти перед этим курсом
    prerequisites_rel = AsyncRelationshipFrom(
        ".course.Course",
        "REQUIRES_PREREQUISITE",
        AsyncZeroOrMore,
    )

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        from .cohort import Cohort
        from .specialization import Specialization
        from .tag import Tag

        await cls._check_relationship_before_creation(data, 'cohort', Cohort)
        await cls._check_relationship_before_creation(data, 'specialization', Specialization)
        await cls._check_relationship_before_creation(data, "prerequisites", cls)
        await cls._check_relationship_before_creation(data, "tags", Tag)

    async def _after_creation(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'cohort')
        await self._update_relationship(data, 'specialization')
        await self._update_relationship(data, "prerequisites")
        await self._update_relationship(data, "tags")

    async def _before_update(self, data: DictStrAny) -> None:
        from .specialization import Specialization
        from .tag import Tag

        await self._check_relationship_before_update(data, 'specialization', Specialization)
        await self._check_relationship_before_update(data, "prerequisites", self.__class__)
        await self._check_relationship_before_update(data, "tags", Tag)

    async def _after_update(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'specialization')
        await self._update_relationship(data, "prerequisites")
        await self._update_relationship(data, "tags")

    @classmethod
    async def check_nodes(cls, data: list[DictStrAny], total_semesters: int) -> CourseNodes:
        """
        Проверяет корректность списка курсов для когорты.

        Проверки:
        1. Для всех курсов: 0 < semester_number <= total_semesters
        2. Все переданные course_id должны существовать в БД
        3. Коды всех курсов должны быть уникальны (в том числе в БД)
        4. Ровно один курс должен иметь is_last=True

        Args:
            data: Список словарей с данными курсов
            total_semesters: Общее количество семестров в программе

        Returns:
            Словарь с данными курсов, где ключи - course_id (если есть) или code

        Raises:
            NotFoundException: Если какой-либо course_id не найден в БД
            ConflictException: Если есть дублирующиеся коды или нарушена уникальность
            BadRequestException: Если нарушены условия семестров, нет или более одного курса с is_last=True
        """
        # Проверка 1: Проверяем диапазон semester_number для всех курсов
        for item in data:
            course_id = item.get('course_id')
            code = item.get('code')
            semester_number = item.get('semester_number')

            key = course_id if course_id is not None else code

            if semester_number is None:
                raise BadRequestException(f"Курс '{key}' не имеет semester_number")

            if semester_number <= 0 or semester_number > total_semesters:
                raise BadRequestException(
                    f"Курс '{key}' имеет semester_number={semester_number}, "
                    f"должно быть в диапазоне [1, {total_semesters}]"
                )

        # Проверка 2: Проверяем все переданные course_id
        course_ids = [item.get('course_id') for item in data if item.get('course_id') is not None]

        for course_id in course_ids:
            try:
                await cls.get_by_id(course_id)
            except NotFoundException:
                raise NotFoundException(f"Курс с ID {course_id} не найден")

        # Проверка 3: Проверяем уникальность кода
        # Собираем все коды из переданных данных и их связь с элементами
        code_to_items = defaultdict(list)
        for item in data:
            code = item.get('code')
            if code:
                code_to_items[code].append(item)

        # Подпроверка 3.1: Проверяем дублирование кодов в самих переданных данных
        for code, items in code_to_items.items():
            if len(items) > 1:
                # Есть дублирование в переданных данных
                raise ConflictException(f"Дубликат кода '{code}'")

        # Подпроверка 3.2: Проверяем коды в БД (исключая курсы, которые мы обновляем)
        for code, items in code_to_items.items():
            try:
                existing_course = await cls.nodes.get(code=code)
                # Если код существует в БД, проверяем, что этот курс обновляется в переданных данных
                # (может иметь другой код, но тот же course_id)
                is_updating = any(
                    item.get('course_id') == existing_course.course_id
                    for item in data  # Проверяем все элементы, не только items с этим кодом
                )
                if not is_updating:
                    # Код существует в БД и не обновляется - это ошибка
                    raise ConflictException(f"Код '{code}' уже используется в базе")
            except DoesNotExist:
                pass

        # Проверка 4: Проверяем наличие ровно одного курса с is_last=True
        last_courses = [item for item in data if item.get('is_last') is True]

        if len(last_courses) == 0:
            raise BadRequestException("Один из курсов должен иметь is_last=True")
        elif len(last_courses) > 1:
            raise BadRequestException(f"Только один курс может иметь is_last=True, найдено {len(last_courses)}")


        # Строим результирующий словарь с данными курсов из переданного data
        result: CourseNodes = {}

        for item in data:
            course_id = item.get('course_id')
            code = item.get('code')

            if course_id is not None:
                # Если есть course_id, используем его как ключ
                result[course_id] = item
            else:
                # Если нет course_id, используем code как ключ
                result[code] = item

        return result

    @classmethod
    async def check_edges(cls, edges: list[CourseEdge], nodes: CourseNodes) -> dict[CourseKey, list[CourseKey]]:
        """
        Проверяет корректность связей между курсами.

        Проверки:
        1. Все source и target есть в ключах словаря nodes
        2. У курса с is_last=True нет исходящих связей
        3. У всех остальных курсов есть хотя бы одна исходящая связь
        4. Нет циклов в графе
        5. Для всех связей: source.semester_number <= target.semester_number

        Args:
            edges: Список связей, каждая связь имеет поля 'source' и 'target'
            nodes: Словарь валидных нод из check_nodes

        Returns:
            Словарь, где ключи - курсы (target), значения - список их пререквизитов (source)

        Raises:
            BadRequestException: При нарушении условий 2, 3, 5
            ConflictException: При нарушении условия 1 или обнаружении циклов
        """
        # Проверка 1: Проверяем, что все source и target есть в nodes
        for edge in edges:
            source = edge.get('source')
            target = edge.get('target')

            if source not in nodes:
                raise ConflictException(f"Source '{source}' не найден в списке курсов")
            if target not in nodes:
                raise ConflictException(f"Target '{target}' не найден в списке курсов")

        # Находим курс с is_last=True
        last_course_key = None
        for key, node_data in nodes.items():
            if node_data.get('is_last') is True:
                last_course_key = key
                break

        # Проверка 2: Курс с is_last=True не должен иметь исходящих связей
        if last_course_key is not None:
            outgoing_edges = [edge for edge in edges if edge.get('source') == last_course_key]
            if outgoing_edges:
                raise BadRequestException(f"Курс с is_last=True не может иметь исходящих связей")

        # Проверка 3: Все остальные курсы должны иметь хотя бы одну исходящую связь
        for key in nodes.keys():
            if key == last_course_key:
                continue
            outgoing_edges = [edge for edge in edges if edge.get('source') == key]
            if not outgoing_edges:
                raise BadRequestException(f"Курс '{key}' должен иметь хотя бы одну исходящую связь")

        # Проверка 4: Проверяем отсутствие циклов (DFS)
        # Строим граф adjacency list
        graph: dict[CourseKey, list[CourseKey]] = defaultdict(list)
        for edge in edges:
            source = edge.get('source')
            target = edge.get('target')
            graph[source].append(target)

        # DFS для обнаружения циклов
        visited = set()
        rec_stack = set()

        def has_cycle(node: CourseKey) -> bool:
            visited.add(node)
            rec_stack.add(node)

            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    if has_cycle(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True

            rec_stack.remove(node)
            return False

        for node in nodes.keys():
            if node not in visited:
                if has_cycle(node):
                    raise ConflictException("Обнаружен цикл в графе связей курсов")

        # Проверка 5: Для всех связей source.semester_number <= target.semester_number
        for edge in edges:
            source_key = edge.get('source')
            target_key = edge.get('target')

            source_data = nodes[source_key]
            target_data = nodes[target_key]

            source_semester = source_data.get('semester_number')
            target_semester = target_data.get('semester_number')

            if source_semester is None or target_semester is None:
                raise BadRequestException(f"Один из курсов не имеет semester_number")

            if source_semester > target_semester:
                raise BadRequestException(
                    f"Нарушено условие семестров: курс '{source_key}' (семестр {source_semester}) "
                    f"не может быть пререквизитом для курса '{target_key}' (семестр {target_semester})"
                )

        # Строим результирующий словарь: target -> список source
        result: dict[CourseKey, list[CourseKey]] = defaultdict(list)
        for edge in edges:
            source = edge.get('source')
            target = edge.get('target')
            result[target].append(source)

        return dict(result)

    @classmethod
    async def update_cohort_courses(
        cls,
        cohort: 'Cohort',
        nodes: CourseNodes,
        prerequisites: dict[CourseKey, list[CourseKey]]
    ) -> None:
        """
        Обновляет все курсы и связи для когорты.

        Процесс:
        1. Удаляет все курсы и связи, которых нет в переданных данных
        2. Обновляет существующие курсы (с учетом правильного порядка обновления кодов)
        3. Создает новые курсы
        4. Обновляет связи пререквизитов

        Args:
            cohort: Год набора
            nodes: Словарь валидных нод из check_nodes
            prerequisites: Словарь пререквизитов из check_edges
        """

        # Шаг 1: Удаляем курсы, которых нет в переданных данных
        existing_course_ids = {c.course_id for c in cohort.courses if c.course_id}
        new_course_ids = {k for k in nodes.keys() if isinstance(k, int)}

        courses_to_delete = existing_course_ids - new_course_ids
        for course_id in courses_to_delete:
            await cls.delete_by_id(course_id)

        # Шаг 2: Обновляем существующие курсы в правильном порядке
        # Получаем все существующие курсы, которые нужно обновить
        existing_courses = {c.course_id: c for c in cohort.courses if c.course_id in new_course_ids}

        # Разделяем на три группы для правильного обновления кодов
        unchanged_code = []  # код не поменялся
        new_code_not_in_db = []  # новый код не был в БД
        new_code_was_in_db = []  # новый код был в БД у другого курса

        all_existing_codes = {c.code: c.course_id for c in cohort.courses if c.course_id}

        for course_id, course in existing_courses.items():
            node_data = nodes[course_id]
            new_code = node_data.get('code')
            old_code = course.code

            if new_code == old_code:
                unchanged_code.append((course_id, node_data))
            elif new_code in all_existing_codes and all_existing_codes[new_code] != course_id:
                new_code_was_in_db.append((course_id, node_data))
            else:
                new_code_not_in_db.append((course_id, node_data))

        # Обновляем в правильном порядке
        for course_id, node_data in unchanged_code + new_code_not_in_db:
            await cls.update_node(course_id, node_data)

        # Для цепочек обновляем в топологическом порядке
        # Строим граф зависимостей кодов: старый_код -> новый_код
        code_update_graph = {}
        for course_id, node_data in new_code_was_in_db:
            course = existing_courses[course_id]
            old_code = course.code
            new_code = node_data.get('code')
            code_update_graph[old_code] = new_code

        # Обновляем цепочки в правильном порядке (от конца цепочки к началу)
        updated_in_chain = set()
        for course_id, node_data in new_code_was_in_db:
            if course_id in updated_in_chain:
                continue

            course = existing_courses[course_id]
            old_code = course.code

            # Находим всю цепочку от текущего к концу
            chain = []
            current_code = old_code
            while current_code in code_update_graph:
                next_code = code_update_graph[current_code]
                # Находим course_id для этого нового кода
                for cid, nd in new_code_was_in_db:
                    if nd.get('code') == next_code and existing_courses[cid].code == current_code:
                        chain.append((cid, nd))
                        updated_in_chain.add(cid)
                        current_code = next_code
                        break

            # Обновляем цепочку в обратном порядке (от конца к началу)
            for cid, nd in reversed(chain):
                await cls.update_node(cid, nd)
            # Обновляем начало цепочки
            await cls.update_node(course_id, node_data)
            updated_in_chain.add(course_id)

        # Шаг 3: Создаем новые курсы
        # Новые курсы - это те, у которых нет course_id в исходных данных
        for key, node_data in nodes.items():
            if not isinstance(key, int):  # Это новый курс (без course_id)
                node_data['cohort_id'] = cohort.cohort_id
                await cls.create_node(node_data)

        # Шаг 4: Обновляем связи пререквизитов
        # Удаляем все старые связи
        await cohort.refresh_node('courses.prerequisites')
        for course in cohort.courses:
            await course.prerequisites_rel.disconnect_all()

        # Строим карту: ключ (course_id или code) -> объект курса
        course_by_key: dict[CourseKey, 'Course'] = {}
        for course in cohort.courses:
            course_by_key[course.course_id] = course
            course_by_key[course.code] = course

        # Создаем новые связи согласно prerequisites
        for target_key, source_keys in prerequisites.items():
            target_course = course_by_key.get(target_key)
            if not target_course:
                print(f"Warning: Target course '{target_key}' not found for prerequisites, skipping")
                continue

            for source_key in source_keys:
                source_course = course_by_key.get(source_key)
                if not source_course:
                    print(f"Warning: Source course '{source_key}' not found for prerequisites, skipping")
                    continue
                await target_course.prerequisites_rel.connect(source_course)
