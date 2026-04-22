from neomodel import (
    DateTimeProperty,
    IntegerProperty,
    AsyncRelationshipFrom,
    StringProperty,
    AsyncZeroOrMore,
)

from ..base_node import BaseNode


class Faculty(BaseNode):
    """Факультет"""
    _cascade_delete_relations = ['programs', 'teachers']

    faculty_id = IntegerProperty(unique_index=True, required=True)
    name = StringProperty(unique_index=True, required=True)
    short_name = StringProperty(unique_index=True, required=True)
    created_at = DateTimeProperty(default=BaseNode.now)

    # Связи (входящие)
    programs_rel = AsyncRelationshipFrom(
        ".program.Program",
        "BELONGS_TO_FACULTY",
        AsyncZeroOrMore,
    )

    teachers_rel = AsyncRelationshipFrom(
        ".teacher.Teacher",
        "WORKS_AT_FACULTY",
        AsyncZeroOrMore,
    )

