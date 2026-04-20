from neomodel import (
    StringProperty,
    IntegerProperty,
    DateTimeProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
    AsyncZeroOrMore,
    BooleanProperty,
)

from ..base_node import BaseNode
from ...exceptions import BadRequestException
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
    telegram = StringProperty()
    isu_id = IntegerProperty(index=True)
    is_admin = BooleanProperty(default=False)
    created_at = DateTimeProperty(default=BaseNode.now)
    updated_at = DateTimeProperty(default=BaseNode.now)

    # Связи (входящие) - история записей студента/преподавателя
    oauth_provider_rel = AsyncRelationshipFrom(
        ".oauth_provider.OAuthProvider",
        "PROVIDER_OF",
        AsyncZeroOrMore,
    )

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
        from .oauth_provider import OAuthProvider
        from .tag import Tag

        provider = data.get('provider')
        provider_user_id = data.get('provider_user_id')
        if provider is not None and provider_user_id is not None:
            oauth_provider = await OAuthProvider.get_oauth_provider_by_user_provider(provider, provider_user_id)
            if oauth_provider is not None:
                raise BadRequestException("Пользователь с таким провайдером и ID уже существует")
            oauth_provider = await OAuthProvider.create_node({'provider': provider, 'provider_user_id': provider_user_id})
            data['oauth_provider_obj'] = [oauth_provider]

        await cls._check_relationship_before_creation(data, 'tags', Tag)

    async def _after_creation(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'tags')
        await self._update_relationship(data, 'oauth_provider')

    async def _before_update(self, data: DictStrAny) -> None:
        from .tag import Tag

        await self._check_relationship_before_update(data, 'tags', Tag)

    async def _after_update(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'tags')
