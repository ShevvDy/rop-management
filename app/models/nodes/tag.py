from neomodel import (
    AsyncRelationshipFrom,
    StringProperty,
    IntegerProperty,
)

from ..base_node import BaseNode


class Tag(BaseNode):
    """Тег для категоризации различных сущностей"""

    tag_id = IntegerProperty(unique_index=True)
    name = StringProperty(unique_index=True, required=True)

    # Связи (входящие) - many-to-many через связи
    users_rel = AsyncRelationshipFrom(
        ".user.User",
        "HAS_TAG"
    )

    courses_rel = AsyncRelationshipFrom(
        ".course.Course",
        "HAS_TAG"
    )

    checkpoints_rel = AsyncRelationshipFrom(
        ".checkpoint.Checkpoint",
        "HAS_TAG"
    )

    teams_rel = AsyncRelationshipFrom(
        ".team.Team",
        "HAS_TAG"
    )

