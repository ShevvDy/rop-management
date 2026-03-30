from neomodel import (
    IntegerProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo, AsyncOne, AsyncZeroOrOne, AsyncZeroOrMore,
)

from ..base_node import BaseNode
from ...exceptions import ForeignKeyException
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

    education_plan_rel = AsyncRelationshipFrom(
        ".planned_course.PlannedCourse",
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

        program_id = data.pop("program_id", None)
        if not program_id:
            raise ForeignKeyException()
        program = await Program.get_by_id(program_id)
        if program is None:
            raise ForeignKeyException(node="Program", node_id=program_id)
        data["program_obj"] = program

        director_id = data.pop("director_id", None)
        if director_id:
            director = await User.get_by_id(director_id)
            if director:
                data["director_obj"] = director

        manager_id = data.pop("manager_id", None)
        if manager_id:
            manager = await User.get_by_id(manager_id)
            if manager:
                data["manager_obj"] = manager

    async def _after_creation(self, data: DictStrAny) -> None:
        program = data.pop("program_obj")
        await self.program_rel.connect(program)
        self._relations["program"] = program
        await program.load_relations("faculty")

        director = data.pop("director_obj", None)
        if director:
            await self.director_rel.connect(director)
            self._relations["director"] = director

        manager = data.pop("manager_obj", None)
        if manager:
            await self.manager_rel.connect(manager)
            self._relations["manager"] = manager

