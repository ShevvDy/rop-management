from neomodel import (
    IntegerProperty,
    AsyncRelationshipFrom,
    StringProperty,
)

from ..base_node import BaseNode


class Semester(BaseNode):
    """Семестр"""

    semester_id = IntegerProperty(unique_index=True)
    semester_number = IntegerProperty(required=True)
    study_year = StringProperty(required=True)  # Формат: "2023/2024"

    # Связи (входящие)
    streams_rel = AsyncRelationshipFrom(
        ".stream.Stream",
        "IN_SEMESTER"
    )

    planned_courses_rel = AsyncRelationshipFrom(
        ".planned_course.PlannedCourse",
        "IN_SEMESTER"
    )

