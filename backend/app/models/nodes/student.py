from neomodel import (
    DateProperty,
    AsyncRelationshipTo,
    StringProperty,
    IntegerProperty,
    AsyncOne,
    AsyncZeroOrOne,
)

from ..base_node import BaseNode
from ..enums import StudentStatus
from ...utils.types import DictStrAny


class Student(BaseNode):
    """
    Запись о студенте (период обучения).
    Каждая нода представляет один период - при переводе создается новая запись.
    """

    student_id = IntegerProperty(unique_index=True)
    start_date = DateProperty(default=lambda: BaseNode.today().replace(month=9, day=1))
    end_date = DateProperty(required=True)
    status = StringProperty(choices=StudentStatus.choices())

    # Связи (исходящие)
    user_rel = AsyncRelationshipTo(
        ".user.User",
        "STUDENT_RECORD_OF",
        AsyncOne,
    )

    cohort_rel = AsyncRelationshipTo(
        ".cohort.Cohort",
        "ENROLLED_IN_COHORT",
        AsyncOne,
    )

    group_rel = AsyncRelationshipTo(
        ".group.Group",
        "STUDIES_IN_GROUP",
        AsyncZeroOrOne,
    )

    def is_active(self) -> bool:
        """Проверка активности студента"""
        today = BaseNode.today()
        return self.start_date <= today < self.end_date

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        from .user import User
        from .cohort import Cohort
        from .group import Group

        await cls._check_relationship_before_creation(data, 'user', User)
        await cls._check_relationship_before_creation(data, 'cohort', Cohort)
        await cls._check_relationship_before_creation(data, 'group', Group)

    async def _after_creation(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'user')
        await self._update_relationship(data, 'cohort')
        await self._update_relationship(data, 'group')
