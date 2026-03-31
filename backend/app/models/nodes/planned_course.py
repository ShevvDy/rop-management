from neomodel import (
    AsyncRelationshipTo,
    IntegerProperty,
    AsyncOne,
    AsyncZeroOrOne,
)

from ..base_node import BaseNode
from ...utils.types import DictStrAny


class PlannedCourse(BaseNode):
    """
    Запланированный курс в учебном плане.
    Связывает когорту, курс, семестр и опционально специализацию.
    Представляет контекст изучения курса в учебном плане.
    Это гиперребро (hyperedge) для 4-way relationship.
    """

    # Дополнительные свойства можно добавить в будущем:
    # is_mandatory = BooleanProperty(default=True)
    # order_in_semester = IntegerProperty()
    planned_course_id = IntegerProperty(unique_index=True)

    # Связи (исходящие)
    cohort_rel = AsyncRelationshipTo(
        ".cohort.Cohort",
        "PLANNED_FOR_COHORT",
        AsyncOne,
    )

    course_rel = AsyncRelationshipTo(
        ".course.Course",
        "PLANS_COURSE",
        AsyncOne,
    )

    semester_rel = AsyncRelationshipTo(
        ".semester.Semester",
        "IN_SEMESTER",
        AsyncOne,
    )

    specialization_rel = AsyncRelationshipTo(
        ".specialization.Specialization",
        "FOR_SPECIALIZATION",
        AsyncZeroOrOne,
    )

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        from .cohort import Cohort
        from .course import Course
        from .semester import Semester
        from .specialization import Specialization

        await cls._check_relationship_before_creation(data, 'cohort', Cohort)
        await cls._check_relationship_before_creation(data, 'course', Course)
        await cls._check_relationship_before_creation(data, 'semester', Semester)
        await cls._check_relationship_before_creation(data, 'specialization', Specialization)

    async def _after_creation(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'cohort')
        await self._update_relationship(data, 'course')
        await self._update_relationship(data, 'semester')
        await self._update_relationship(data, 'specialization')

    async def _before_update(self, data: DictStrAny) -> None:
        from .semester import Semester
        from .specialization import Specialization

        await self._check_relationship_before_update(data, 'semester', Semester)
        await self._check_relationship_before_update(data, 'specialization', Specialization)

    async def _after_update(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'semester')
        await self._update_relationship(data, 'specialization')
