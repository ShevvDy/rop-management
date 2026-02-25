from neomodel import (
    StringProperty,
    IntegerProperty,
    DateTimeProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
)

from ..base_node import BaseNode


class User(BaseNode):
    """
    Узел пользователя в графовой БД Neo4j.
    Содержит базовую информацию о пользователе системы.
    """

    # Основные свойства
    user_id = IntegerProperty(unique_index=True)
    name = StringProperty(required=True)
    surname = StringProperty(required=True)
    patronymic = StringProperty()
    email = StringProperty(index=True)
    phone = StringProperty()
    isu_id = IntegerProperty(index=True)
    created_at = DateTimeProperty(default=BaseNode.now)
    updated_at = DateTimeProperty(default=BaseNode.now)

    # Связи (входящие) - история записей студента/преподавателя
    student_data_rel = AsyncRelationshipFrom(
        ".student.Student",
        "STUDENT_RECORD_OF"
    )

    teacher_data_rel = AsyncRelationshipFrom(
        ".teacher.Teacher",
        "TEACHER_RECORD_OF"
    )

    # Связи (входящие)
    # Когорты, которыми руководит (директор)
    directed_cohorts_rel = AsyncRelationshipFrom(
        ".cohort.Cohort",
        "DIRECTS_BY"
    )

    # Когорты, которыми управляет (менеджер)
    managed_cohorts_rel = AsyncRelationshipFrom(
        ".cohort.Cohort",
        "MANAGES_BY"
    )

    # Связи (исходящие)
    # Теги пользователя
    tags_rel = AsyncRelationshipTo(
        ".tag.Tag",
        "HAS_TAG"
    )

    # Связи (входящие) - команды
    owned_teams_rel = AsyncRelationshipFrom(
        ".team.Team",
        "OWNED_BY"
    )

    teams_rel = AsyncRelationshipFrom(
        ".team.Team",
        "HAS_MEMBER"
    )
