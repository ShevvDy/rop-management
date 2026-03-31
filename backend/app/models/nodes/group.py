from neomodel import (
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    StringProperty,
    IntegerProperty, AsyncOne, AsyncZeroOrOne, AsyncZeroOrMore,
)

from ..base_node import BaseNode
from ...utils.types import DictStrAny


class Group(BaseNode):
    """Учебная группа"""

    group_id = IntegerProperty(unique_index=True)
    name = StringProperty(unique_index=True, required=True)

    # Связи (исходящие)
    cohort_rel = AsyncRelationshipTo(
        ".cohort.Cohort",
        "BELONGS_TO_COHORT",
        AsyncOne,
    )

    specialization_rel = AsyncRelationshipTo(
        ".specialization.Specialization",
        "BELONGS_TO_SPECIALIZATION",
        AsyncZeroOrOne,
    )

    # Связи (входящие)
    students_rel = AsyncRelationshipFrom(
        ".student.Student",
        "STUDIES_IN_GROUP",
        AsyncZeroOrMore,
    )

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        from .cohort import Cohort
        from .specialization import Specialization

        await cls._check_relationship_before_creation(data, 'cohort', Cohort)
        await cls._check_relationship_before_creation(data, 'specialization', Specialization)

    async def _after_creation(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'cohort')
        await self._update_relationship(data, 'specialization')

    async def _before_update(self, data: DictStrAny) -> None:
        from .specialization import Specialization
        await self._check_relationship_before_update(data, 'specialization', Specialization)

    async def _after_update(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'specialization')
