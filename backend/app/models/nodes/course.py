from neomodel import (
    BooleanProperty,
    IntegerProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    StringProperty, AsyncZeroOrMore,
)

from ..base_node import BaseNode
from ..enums import EducationForm
from ...utils.types import DictStrAny


class Course(BaseNode):
    """Курс/Дисциплина"""

    course_id = IntegerProperty(unique_index=True)
    name = StringProperty(required=True)
    code = StringProperty(required=True)
    credits = IntegerProperty(required=True)
    form = StringProperty(default=EducationForm.offline, choices=EducationForm.choices())
    is_elective = BooleanProperty(default=False)
    syllabus_link = StringProperty()
    rpd_link = StringProperty()

    # Связи (исходящие)
    # Пререквизиты - курсы, которые нужно пройти перед этим курсом
    prerequisites_rel = AsyncRelationshipTo(
        ".course.Course",
        "REQUIRES_PREREQUISITE",
        AsyncZeroOrMore,
    )

    # Теги курса
    tags_rel = AsyncRelationshipTo(
        ".tag.Tag",
        "HAS_TAG",
        AsyncZeroOrMore,
    )

    # Связи (входящие)
    # Курсы, для которых этот курс является пререквизитом
    dependent_courses_rel = AsyncRelationshipFrom(
        ".course.Course",
        "REQUIRES_PREREQUISITE",
        AsyncZeroOrMore,
    )

    planned_in_rel = AsyncRelationshipFrom(
        ".planned_course.PlannedCourse",
        "PLANS_COURSE",
        AsyncZeroOrMore,
    )

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        from .tag import Tag

        await cls._check_relationship_before_creation(data, "prerequisites", cls)
        await cls._check_relationship_before_creation(data, "tags", Tag)

    async def _after_creation(self, data: DictStrAny) -> None:
        await self._update_relationship(data, "prerequisites")
        await self._update_relationship(data, "tags")

    async def _before_update(self, data: DictStrAny) -> None:
        from .tag import Tag

        await self._check_relationship_before_update(data, "prerequisites", self.__class__)
        await self._check_relationship_before_update(data, "tags", Tag)

    async def _after_update(self, data: DictStrAny) -> None:
        await self._update_relationship(data, "prerequisites")
        await self._update_relationship(data, "tags")
