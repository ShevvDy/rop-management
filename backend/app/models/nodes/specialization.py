from neomodel import (
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    StringProperty,
    IntegerProperty,
    AsyncOne,
    AsyncZeroOrMore,
)

from ..base_node import BaseNode
from ...exceptions import ForeignKeyException
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

    education_plan_rel = AsyncRelationshipFrom(
        ".planned_course.PlannedCourse",
        "FOR_SPECIALIZATION",
        AsyncZeroOrMore,
    )

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        from .cohort import Cohort

        cohort_id = data.pop("cohort_id", None)
        if not cohort_id:
            raise ForeignKeyException()
        cohort = await Cohort.get_by_id(cohort_id)
        if not cohort:
            raise ForeignKeyException(node="Cohort", node_id=cohort_id)
        data["cohort_obj"] = cohort

    async def _after_creation(self, data: DictStrAny) -> None:
        cohort = data.pop("cohort_obj")
        await self.cohort_rel.connect(cohort)
        self._relations["cohort"] = cohort
