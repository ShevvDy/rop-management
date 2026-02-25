from neomodel import (
    DateProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    StringProperty,
    IntegerProperty,
)

from ..base_node import BaseNode
from ..enums import EducationForm


class Stream(BaseNode):
    """
    Поток - конкретная реализация курса в определенном семестре.
    Связывает курс, семестр, преподавателя и студентов.
    """

    stream_id = IntegerProperty(unique_index=True)
    name = StringProperty(required=True, max_length=15)
    form = StringProperty(default=EducationForm.offline, choices=EducationForm.choices())
    start_date = DateProperty(required=True)
    exam_date = DateProperty()  # NULL если нет экзамена

    # Связи (исходящие)
    semester_rel = AsyncRelationshipTo(
        ".semester.Semester",
        "IN_SEMESTER"
    )

    course_rel = AsyncRelationshipTo(
        ".course.Course",
        "TEACHES_COURSE"
    )

    teacher_rel = AsyncRelationshipTo(
        ".teacher.Teacher",
        "TAUGHT_BY_TEACHER"
    )

    # Связи (входящие)
    students_rel = AsyncRelationshipFrom(
        ".student.Student",
        "ATTENDS_STREAM"
    )

    checkpoints_rel = AsyncRelationshipFrom(
        ".checkpoint.Checkpoint",
        "CHECKPOINT_IN_STREAM"
    )
