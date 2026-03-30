from neomodel import (
    IntegerProperty,
    AsyncRelationshipFrom,
    StringProperty,
    AsyncZeroOrMore,
)

from ..base_node import BaseNode
from ...utils.types import DictStrAny


class Semester(BaseNode):
    """Семестр"""

    semester_id = IntegerProperty(unique_index=True)
    semester_number = IntegerProperty(required=True)
    study_year = StringProperty(required=True)  # Формат: "2023/2024"

    planned_courses_rel = AsyncRelationshipFrom(
        ".planned_course.PlannedCourse",
        "IN_SEMESTER",
        AsyncZeroOrMore,
    )
