from neomodel import (
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    StringProperty,
    IntegerProperty,
)

from ..base_node import BaseNode


class Group(BaseNode):
    """Учебная группа"""

    group_id = IntegerProperty(unique_index=True)
    name = StringProperty(unique_index=True, required=True)

    # Связи (исходящие)
    program_rel = AsyncRelationshipTo(
        ".program.Program",
        "BELONGS_TO_PROGRAM"
    )

    specialization_rel = AsyncRelationshipTo(
        ".specialization.Specialization",
        "BELONGS_TO_SPECIALIZATION"
    )

    # Связи (входящие)
    students_rel = AsyncRelationshipFrom(
        ".student.Student",
        "STUDIES_IN_GROUP"
    )
