from neomodel import (
    IntegerProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    StringProperty,
    AsyncOne,
)

from ..base_node import BaseNode
from ..enums import EducationForm, EducationLang, EducationLevel
from ...exceptions import ForeignKeyException
from ...utils.types import DictStrAny


class Program(BaseNode):
    """Образовательная программа"""

    program_id = IntegerProperty(unique_index=True)
    name = StringProperty(unique_index=True, required=True)
    accreditation_year = IntegerProperty(required=True)
    level = StringProperty(required=True, choices=EducationLevel.choices())
    form = StringProperty(default=EducationForm.offline, choices=EducationForm.choices())
    lang = StringProperty(required=True, choices=EducationLang.choices())
    duration_years = IntegerProperty(required=True)

    # Связи (исходящие)
    faculty_rel = AsyncRelationshipTo(
        ".faculty.Faculty",
        "BELONGS_TO_FACULTY",
        AsyncOne,
    )

    # Связи (входящие)
    cohorts_rel = AsyncRelationshipFrom(
        ".cohort.Cohort",
        "BELONGS_TO_PROGRAM"
    )

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        from .faculty import Faculty

        faculty_id = data.pop("faculty_id")
        if not faculty_id:
            raise ForeignKeyException()
        faculty = await Faculty.get_by_id(faculty_id)
        if faculty is None:
            raise ForeignKeyException(node="Faculty", node_id=faculty_id)
        data["faculty_obj"] = faculty

    async def _after_creation(self, data: DictStrAny) -> None:
        faculty = data.pop("faculty_obj")
        await self.faculty_rel.connect(faculty)
        self._relations["faculty"] = faculty
