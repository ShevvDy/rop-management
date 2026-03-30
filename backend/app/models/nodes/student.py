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
from ...exceptions import ForeignKeyException
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

        user_id = data.pop("user_id", None)
        cohort_id = data.pop("cohort_id", None)
        group_id = data.pop("group_id", None)
        if not user_id or not cohort_id:
            raise ForeignKeyException()

        user = await User.get_by_id(user_id)
        if not user:
            raise ForeignKeyException(node="User", node_id=user_id)
        data['user_obj'] = user

        cohort = await Cohort.get_by_id(cohort_id)
        if not cohort:
            raise ForeignKeyException(node="Cohort", node_id=cohort_id)
        data['cohort_obj'] = cohort

        if group_id:
            group = await Group.get_by_id(group_id)
            if group:
                data['group_obj'] = group

    async def _after_creation(self, data: DictStrAny) -> None:
        user = data.pop("user_obj")
        await self.user_rel.connect(user)
        self._relations["user"] = user

        cohort = data.pop("cohort_obj")
        await self.cohort_rel.connect(cohort)
        self._relations["cohort"] = cohort

        group = data.pop("group_obj", None)
        if group:
            await self.group_rel.connect(group)
            self._relations["group"] = group
