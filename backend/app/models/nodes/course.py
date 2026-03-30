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

        prerequisites_ids = data.pop("prerequisites_ids", [])
        prerequisites = []
        for prereq_id in prerequisites_ids:
            prereq_course = await cls.get_by_id(prereq_id)
            if prereq_course is not None:
                prerequisites.append(prereq_course)
        data["prerequisites_objs"] = prerequisites

        tags_ids = data.pop("tags_ids", [])
        tags = []
        for tag_id in tags_ids:
            tag = await Tag.get_by_id(tag_id)
            if tag is not None:
                tags.append(tag)
        data["tags_objs"] = tags

    async def _after_creation(self, data: DictStrAny) -> None:
        prerequisites = data.pop("prerequisites_objs", [])
        for prereq_course in prerequisites:
            await self.prerequisites_rel.connect(prereq_course)
        self._relations["prerequisites"] = prerequisites

        tags = data.pop("tags_objs", [])
        for tag in tags:
            await self.tags_rel.connect(tag)
        self._relations["tags"] = tags
