from neomodel import (
    DateProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    StringProperty,
    IntegerProperty,
)

from ..base_node import BaseNode
from ..enums import TeacherPosition


class Teacher(BaseNode):
    """
    Запись о преподавателе (период работы).
    Каждая нода представляет один период - при смене факультета создается новая запись.
    """

    teacher_id = IntegerProperty(unique_index=True)
    start_date = DateProperty(default=BaseNode.today)
    end_date = DateProperty()  # NULL = текущая позиция
    position = StringProperty(required=True, choices=TeacherPosition.choices())

    # Связи (исходящие)
    user_rel = AsyncRelationshipTo(
        ".user.User",
        "TEACHER_RECORD_OF"
    )

    faculty_rel = AsyncRelationshipTo(
        ".faculty.Faculty",
        "WORKS_AT_FACULTY"
    )

    # Связи (входящие)
    taught_streams_rel = AsyncRelationshipFrom(
        ".stream.Stream",
        "TAUGHT_BY_TEACHER"
    )
