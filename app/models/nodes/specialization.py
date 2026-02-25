from neomodel import (
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    StringProperty,
    IntegerProperty,
)

from ..base_node import BaseNode


class Specialization(BaseNode):
    """Специализация в рамках когорты"""

    specialization_id = IntegerProperty(unique_index=True)
    name = StringProperty(unique_index=True, required=True)

    # Связи (исходящие)
    cohort_rel = AsyncRelationshipTo(
        ".cohort.Cohort",
        "BELONGS_TO_COHORT"
    )

    # Связи (входящие)
    groups_rel = AsyncRelationshipFrom(
        ".group.Group",
        "BELONGS_TO_SPECIALIZATION"
    )

    education_plan_rel = AsyncRelationshipFrom(
        ".planned_course.PlannedCourse",
        "FOR_SPECIALIZATION"
    )

