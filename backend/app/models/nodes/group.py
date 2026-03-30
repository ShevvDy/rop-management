from neomodel import (
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    StringProperty,
    IntegerProperty, AsyncOne, AsyncZeroOrOne, AsyncZeroOrMore,
)

from ..base_node import BaseNode
from ...exceptions import ForeignKeyException
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

        cohort_id = data.pop("cohort_id", None)
        if not cohort_id:
            raise ForeignKeyException()
        cohort = await Cohort.get_by_id(cohort_id)
        if not cohort:
            raise ForeignKeyException(node="Cohort", node_id=cohort_id)
        data["cohort_obj"] = cohort

        specialization_id = data.pop("specialization_id", None)
        if specialization_id:
            specialization = await Specialization.get_by_id(specialization_id)
            if specialization:
                data["specialization_obj"] = specialization

    async def _after_creation(self, data: DictStrAny) -> None:
        cohort = data.pop("cohort_obj")
        await self.cohort_rel.connect(cohort)
        self._relations["cohort"] = cohort

        specialization = data.pop("specialization_obj", None)
        if specialization:
            await self.specialization_rel.connect(specialization)
            self._relations["specialization"] = specialization
