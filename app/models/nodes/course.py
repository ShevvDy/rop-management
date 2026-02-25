from neomodel import (
    BooleanProperty,
    IntegerProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    StringProperty,
)

from ..base_node import BaseNode
from ..enums import EducationForm


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
        "REQUIRES_PREREQUISITE"
    )

    # Теги курса
    tags_rel = AsyncRelationshipTo(
        ".tag.Tag",
        "HAS_TAG"
    )

    # Связи (входящие)
    # Курсы, для которых этот курс является пререквизитом
    dependent_courses_rel = AsyncRelationshipFrom(
        ".course.Course",
        "REQUIRES_PREREQUISITE"
    )

    streams_rel = AsyncRelationshipFrom(
        ".stream.Stream",
        "TEACHES_COURSE"
    )

    teams_rel = AsyncRelationshipFrom(
        ".team.Team",
        "WORKS_ON_COURSE"
    )

    planned_in_rel = AsyncRelationshipFrom(
        ".planned_course.PlannedCourse",
        "PLANS_COURSE"
    )

