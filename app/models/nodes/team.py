from neomodel import (
    BooleanProperty,
    AsyncRelationshipTo,
    StringProperty,
    IntegerProperty,
)

from ..base_node import BaseNode


class Team(BaseNode):
    """
    Команда студентов для работы над проектами/курсами.
    """

    team_id = IntegerProperty(unique_index=True)
    name = StringProperty(required=True)
    is_visible = BooleanProperty(default=True)

    # Связи (исходящие)
    owner_rel = AsyncRelationshipTo(
        ".user.User",
        "OWNED_BY"
    )

    tags_rel = AsyncRelationshipTo(
        ".tag.Tag",
        "HAS_TAG"
    )

    members_rel = AsyncRelationshipTo(
        ".user.User",
        "HAS_MEMBER"
    )

    courses_rel = AsyncRelationshipTo(
        ".course.Course",
        "WORKS_ON_COURSE"
    )

