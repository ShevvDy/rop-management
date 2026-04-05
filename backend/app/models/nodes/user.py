from neomodel import (
    StringProperty,
    IntegerProperty,
    DateTimeProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    AsyncZeroOrMore,
)

from ..base_node import BaseNode
from ...utils.types import DictStrAny


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
        "STUDENT_RECORD_OF",
        AsyncZeroOrMore,
    )

    teacher_data_rel = AsyncRelationshipFrom(
        ".teacher.Teacher",
        "TEACHER_RECORD_OF",
        AsyncZeroOrMore,
    )

    # Связи (входящие)
    # Когорты, которыми руководит (директор)
    directed_cohorts_rel = AsyncRelationshipFrom(
        ".cohort.Cohort",
        "DIRECTS_BY",
        AsyncZeroOrMore,
    )

    # Когорты, которыми управляет (менеджер)
    managed_cohorts_rel = AsyncRelationshipFrom(
        ".cohort.Cohort",
        "MANAGES_BY",
        AsyncZeroOrMore,
    )

    # Связи (исходящие)
    # Теги пользователя
    tags_rel = AsyncRelationshipTo(
        ".tag.Tag",
        "HAS_TAG",
        AsyncZeroOrMore,
    )

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        from .tag import Tag
        await cls._check_relationship_before_creation(data, 'tags', Tag)

    async def _after_creation(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'tags')

    async def _before_update(self, data: DictStrAny) -> None:
        from .tag import Tag

        await self._check_relationship_before_update(data, 'tags', Tag)

    async def _after_update(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'tags')
