from neomodel import (
    AsyncRelationshipTo,
    IntegerProperty,
    AsyncOne,
    AsyncZeroOrOne,
)

from ..base_node import BaseNode
from ...exceptions import ForeignKeyException
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

        cohort_id = data.pop("cohort_id", None)
        course_id = data.pop("course_id", None)
        semester_id = data.pop("semester_id", None)
        specialization_id = data.pop("specialization_id", None)

        if not cohort_id or not course_id or not semester_id:
            raise ForeignKeyException()

        cohort = await Cohort.get_by_id(cohort_id)
        if not cohort:
            raise ForeignKeyException(node="Cohort", node_id=cohort_id)
        data['cohort_obj'] = cohort

        course = await Course.get_by_id(course_id)
        if not course:
            raise ForeignKeyException(node="Course", node_id=course_id)
        data['course_obj'] = course

        semester = await Semester.get_by_id(semester_id)
        if not semester:
            raise ForeignKeyException(node="Semester", node_id=semester_id)
        data['semester_obj'] = semester

        if specialization_id:
            specialization = await Specialization.get_by_id(specialization_id)
            if specialization:
                data['specialization_obj'] = specialization

    async def _after_creation(self, data: DictStrAny) -> None:
        cohort = data.pop("cohort_obj")
        await self.cohort_rel.connect(cohort)
        self._relations["cohort"] = cohort

        course = data.pop("course_obj")
        await self.course_rel.connect(course)
        self._relations["course"] = course

        semester = data.pop("semester_obj")
        await self.semester_rel.connect(semester)
        self._relations["semester"] = semester

        specialization = data.pop("specialization_obj", None)
        if specialization:
            await self.specialization_rel.connect(specialization)
            self._relations["specialization"] = specialization
