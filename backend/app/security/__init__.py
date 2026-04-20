from datetime import UTC, datetime, timedelta
from typing import Optional, Tuple, Type, Callable

import jwt
from fastapi import Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .auth import AuthBase
from .roles import *
from .access import *
from ..exceptions import UnauthorizedException, AppException, ForbiddenException
from ..utils.types import DictStrAny
from ..settings import settings


oauth2_schema = HTTPBearer(auto_error=False)

def get_provider_cls_by_access_token(token: str) -> Optional[Type['AuthBase']]:
    from .auth import AuthYandex

    if token.startswith('y0__'):
        return AuthYandex

    return None


def get_provider_cls_by_refresh_token(refresh_token: str) -> Optional[Type['AuthBase']]:
    from .auth import AuthYandex

    if refresh_token.startswith('2:AAA:'):
        return AuthYandex

    return None


def get_provider_cls_by_name(provider: str) -> Optional[Type['AuthBase']]:
    from .auth import AuthYandex

    provider_cls_map = {
        'yandex': AuthYandex,
    }
    return provider_cls_map.get(provider, None)


def get_jwt_token(payload: DictStrAny, expires_after: timedelta = timedelta(days=365)) -> str:
    payload['exp'] = datetime.now(UTC).replace(tzinfo=None) + expires_after
    token = jwt.encode(payload, settings.JWT_SECRET_KEY)
    return token.decode('UTF-8')


def get_token_from_headers() -> str:
    try:
        authorization: str = Header(None)
        return authorization.split()[-1]
    except:
        raise UnauthorizedException()


def get_provider_token_info(access_token: str) -> Tuple[Type['AuthBase'], DictStrAny]:
    cls = get_provider_cls_by_access_token(access_token)
    if cls is None:
        raise UnauthorizedException()
    validation, status_code, message = cls.validate_token(access_token)
    if status_code != 200:
        raise AppException(status_code=status_code, message=message)
    token_info = cls.get_info_from_jwt_token(access_token)
    return cls, token_info


def role_required(*roles_models: type[Role]) -> Callable:
    async def decorated(credentials: HTTPAuthorizationCredentials = Depends(oauth2_schema)):
        from ..models import OAuthProvider

        if credentials is None:
            raise UnauthorizedException()
        access_token = credentials.credentials
        cls, token_info = get_provider_token_info(access_token)
        user = await OAuthProvider.get_user_by_provider_user_id(cls.provider_name, cls.get_provider_user_id(token_info))
        if user is None:
            raise UnauthorizedException()

        if not roles_models:
            return user
        if not all(issubclass(role, Role) for role in roles_models):
            raise AppException(message="Некорректные роли для проверки доступа")
        if not any([await role.check_role(user) for role in roles_models]):
            raise ForbiddenException()

        return user
    return decorated
