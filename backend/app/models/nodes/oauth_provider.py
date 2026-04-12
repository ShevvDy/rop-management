from typing import Optional, TYPE_CHECKING

from neomodel import IntegerProperty, AsyncRelationshipTo, AsyncOne, StringProperty

from ..base_node import BaseNode
from ..enums import OAuthProviderType
from ...exceptions import BadRequestException
from ...utils.types import DictStrAny

if TYPE_CHECKING:
    from .user import User


class OAuthProvider(BaseNode):
    oauth_provider_id = IntegerProperty(unique_index=True)
    provider = StringProperty(required=True, choices=OAuthProviderType.choices())
    provider_user_id = StringProperty(required=True)

    # Связи (исходящие)
    user_rel = AsyncRelationshipTo(
        ".user.User",
        "PROVIDER_OF",
        AsyncOne,
    )

    @classmethod
    async def _before_creation(cls, data: DictStrAny) -> None:
        from .program import Program
        from .user import User

        await cls._check_relationship_before_creation(data, 'program', Program)
        await cls._check_relationship_before_creation(data, 'director', User)
        await cls._check_relationship_before_creation(data, 'manager', User)

    async def _after_creation(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'program')
        await self._update_relationship(data, 'director')
        await self._update_relationship(data, 'manager')

    async def _before_update(self, data: DictStrAny) -> None:
        from .user import User

        await self._check_relationship_before_update(data, 'director', User)
        await self._check_relationship_before_update(data, 'manager', User)

    async def _after_update(self, data: DictStrAny) -> None:
        await self._update_relationship(data, 'director')
        await self._update_relationship(data, 'manager')

    @classmethod
    async def get_oauth_provider_by_user_provider(
            cls, provider: str, user_id: str
    ) -> Optional['OAuthProvider']:
        if not OAuthProviderType.has_value(provider):
            raise BadRequestException()
        return await cls.nodes.get_or_none(provider=provider, provider_user_id=user_id)

    @classmethod
    async def get_user_by_provider_user_id(
            cls, provider: str, provider_user_id: str
    ) -> Optional['User']:
        oauth_provider = await cls.get_oauth_provider_by_user_provider(provider, provider_user_id)
        if oauth_provider is None:
            return None

        user = await oauth_provider.user_rel.single()  # noqa F821
        return user
