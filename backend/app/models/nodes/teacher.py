from neomodel import (
    DateProperty,
    AsyncRelationshipTo,
    IntegerProperty,
    AsyncOne,
)

from ..base_node import BaseNode
from ...utils.types import DictStrAny


class Teacher(BaseNode):
    """
    Запись о преподавателе (период работы).
    Каждая нода представляет один период - при смене факультета создается новая запись.
    """

    teacher_id = IntegerProperty(unique_index=True)
    start_date = DateProperty(default=BaseNode.today)
    end_date = DateProperty()  # NULL = текущая позиция

    # Связи (исходящие)
    user_rel = AsyncRelationshipTo(
        ".user.User",
        "TEACHER_RECORD_OF",
        AsyncOne,
    )

    faculty_rel = AsyncRelationshipTo(
        ".faculty.Faculty",
        "WORKS_AT_FACULTY",
        AsyncOne,
    )

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        from .user import User
        from .faculty import Faculty

        await cls._check_relationship_before_creation(data, 'user', User)
        await cls._check_relationship_before_creation(data, 'faculty', Faculty)

    async def _after_creation(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'user')
        await self._update_relationship(data, 'faculty')
