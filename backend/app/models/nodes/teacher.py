from neomodel import (
    DateProperty,
    AsyncRelationshipTo,
    IntegerProperty,
    AsyncOne,
)

from ..base_node import BaseNode
from ...exceptions import ForeignKeyException
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

        user_id = data.pop("user_id", None)
        faculty_id = data.pop("faculty_id", None)
        if not user_id or not faculty_id:
            raise ForeignKeyException()

        user = await User.get_by_id(user_id)
        if not user:
            raise ForeignKeyException(node="User", node_id=user_id)
        data['user_obj'] = user

        faulty = await Faculty.get_by_id(faculty_id)
        if not faulty:
            raise ForeignKeyException(node="Faculty", node_id=faculty_id)
        data['faculty_obj'] = faulty

    async def _after_creation(self, data: DictStrAny) -> None:
        user = data.pop("user_obj")
        await self.user_rel.connect(user)
        self._relations["user"] = user

        faculty = data.pop("faculty_obj")
        await self.faculty_rel.connect(faculty)
        self._relations["faculty"] = faculty
