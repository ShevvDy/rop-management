from neomodel import (
    AsyncRelationshipTo,
    IntegerProperty,
)

from ..base_node import BaseNode


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
        "PLANNED_FOR_COHORT"
    )

    course_rel = AsyncRelationshipTo(
        ".course.Course",
        "PLANS_COURSE"
    )

    semester_rel = AsyncRelationshipTo(
        ".semester.Semester",
        "IN_SEMESTER"
    )

    specialization_rel = AsyncRelationshipTo(
        ".specialization.Specialization",
        "FOR_SPECIALIZATION"
    )  # Опциональная связь (может быть NULL)

