from neomodel import (
    IntegerProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
)

from ..base_node import BaseNode


class Cohort(BaseNode):
    """Год набора студентов"""

    cohort_id = IntegerProperty(unique_index=True)
    cohort_year = IntegerProperty(default=lambda: BaseNode.now().year)

    # Связи (исходящие)
    program_rel = AsyncRelationshipTo(
        ".program.Program",
        "BELONGS_TO_PROGRAM"
    )

    director_rel = AsyncRelationshipTo(
        ".user.User",
        "DIRECTS_BY"
    )

    manager_rel = AsyncRelationshipTo(
        ".user.User",
        "MANAGES_BY"
    )

    # Связи (входящие)
    specializations_rel = AsyncRelationshipFrom(
        ".specialization.Specialization",
        "BELONGS_TO_COHORT"
    )

    students_rel = AsyncRelationshipFrom(
        ".student.Student",
        "ENROLLED_IN_COHORT"
    )

    education_plan_rel = AsyncRelationshipFrom(
        ".planned_course.PlannedCourse",
        "PLANNED_FOR_COHORT"
    )


