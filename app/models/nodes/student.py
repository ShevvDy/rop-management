from neomodel import (
    DateProperty,
    AsyncRelationshipTo,
    StringProperty,
    IntegerProperty,
)

from ..base_node import BaseNode
from ..enums import StudentStatus


class Student(BaseNode):
    """
    Запись о студенте (период обучения).
    Каждая нода представляет один период - при переводе создается новая запись.
    """

    student_id = IntegerProperty(unique_index=True)
    start_date = DateProperty(default=lambda: BaseNode.today().replace(month=9, day=1))
    end_date = DateProperty(required=True)
    status = StringProperty(choices=StudentStatus.choices())

    # Связи (исходящие)
    user_rel = AsyncRelationshipTo(
        ".user.User",
        "STUDENT_RECORD_OF"
    )

    cohort_rel = AsyncRelationshipTo(
        ".cohort.Cohort",
        "ENROLLED_IN_COHORT"
    )

    group_rel = AsyncRelationshipTo(
        ".group.Group",
        "STUDIES_IN_GROUP"
    )

    # Связи many-to-many со Stream
    streams_rel = AsyncRelationshipTo(
        ".stream.Stream",
        "ATTENDS_STREAM"
    )

    def is_active(self) -> bool:
        """Проверка активности студента"""
        today = BaseNode.today()
        return self.start_date <= today < self.end_date
