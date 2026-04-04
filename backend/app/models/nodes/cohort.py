from neomodel import (
    IntegerProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo, AsyncOne, AsyncZeroOrOne, AsyncZeroOrMore,
)

from ..base_node import BaseNode
from ...utils.types import DictStrAny


class Cohort(BaseNode):
    """Год набора студентов"""

    cohort_id = IntegerProperty(unique_index=True)
    cohort_year = IntegerProperty(default=lambda: BaseNode.now().year)

    # Связи (исходящие)
    program_rel = AsyncRelationshipTo(
        ".program.Program",
        "BELONGS_TO_PROGRAM",
        AsyncOne,
    )

    director_rel = AsyncRelationshipTo(
        ".user.User",
        "DIRECTS_BY",
        AsyncZeroOrOne,
    )

    manager_rel = AsyncRelationshipTo(
        ".user.User",
        "MANAGES_BY",
        AsyncZeroOrOne,
    )

    # Связи (входящие)
    specializations_rel = AsyncRelationshipFrom(
        ".specialization.Specialization",
        "BELONGS_TO_COHORT",
        AsyncZeroOrMore,
    )

    students_rel = AsyncRelationshipFrom(
        ".student.Student",
        "ENROLLED_IN_COHORT",
        AsyncZeroOrMore,
    )

    courses_rel = AsyncRelationshipFrom(
        ".course.Course",
        "PLANNED_FOR_COHORT",
        AsyncZeroOrMore,
    )

    groups_rel = AsyncRelationshipFrom(
        ".group.Group",
        "BELONGS_TO_COHORT",
        AsyncZeroOrMore,
    )

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        from .program import Program
        from .user import User

        await cls._check_relationship_before_creation(data, 'program', Program)
        await cls._check_relationship_before_creation(data, 'director', User)
        await cls._check_relationship_before_creation(data, 'manager', User)

    async def _after_creation(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'program')
        await self._update_relationship(data, 'director')
        await self._update_relationship(data, 'manager')

    async def _before_update(self, data: DictStrAny) -> None:
        from .user import User

        await self._check_relationship_before_update(data, 'director', User)
        await self._check_relationship_before_update(data, 'manager', User)

    async def _after_update(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'director')
        await self._update_relationship(data, 'manager')
