from neomodel import (
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    StringProperty,
    IntegerProperty,
    AsyncOne,
    AsyncZeroOrMore,
)

from ..base_node import BaseNode
from ...utils.types import DictStrAny


class Specialization(BaseNode):
    """Специализация в рамках когорты"""

    specialization_id = IntegerProperty(unique_index=True)
    name = StringProperty(unique_index=True, required=True)

    # Связи (исходящие)
    cohort_rel = AsyncRelationshipTo(
        ".cohort.Cohort",
        "BELONGS_TO_COHORT",
        AsyncOne,
    )

    # Связи (входящие)
    groups_rel = AsyncRelationshipFrom(
        ".group.Group",
        "BELONGS_TO_SPECIALIZATION",
        AsyncZeroOrMore,
    )

    courses_rel = AsyncRelationshipFrom(
        ".course.Course",
        "FOR_SPECIALIZATION",
        AsyncZeroOrMore,
    )

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        from .cohort import Cohort

        await cls._check_relationship_before_creation(data, 'cohort', Cohort)

    async def _after_creation(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'cohort')

    async def _before_update(self, data: DictStrAny) -> None:
        from .cohort import Cohort
        await self._check_relationship_before_update(data, 'cohort', Cohort)

    async def _after_update(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'cohort')
