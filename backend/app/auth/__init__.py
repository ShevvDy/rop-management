from datetime import UTC, datetime, timedelta
from typing import Callable, Optional, Tuple, Type

import jwt
from fastapi import Header

from ..exceptions import UnauthorizedException, AppException
from ..utils.types import DictStrAny
from .base import AuthBase
from ..settings import settings


ACCESS_TOKEN_REQUIRED = 'Access token required'  # noqa: S105
INVALID_TOKEN = 'Invalid token supplied'  # noqa: S105


def get_provider_cls_by_access_token(token: str) -> Optional[Type['AuthBase']]:
    from .yandex import AuthYandex

    if token.startswith('y0__'):
        return AuthYandex

    return None


def get_provider_cls_by_refresh_token(refresh_token: str) -> Optional[Type['AuthBase']]:
    from .yandex import AuthYandex

    if refresh_token.startswith('2:AAA:'):
        return AuthYandex

    return None


def get_provider_cls_by_name(provider: str) -> Optional[Type['AuthBase']]:
    from .yandex import AuthYandex

    provider_cls_map = {
        'yandex': AuthYandex,
    }
    return provider_cls_map.get(provider, None)


def get_jwt_token(payload: DictStrAny, expires_after: timedelta = timedelta(days=365)) -> str:
    payload['exp'] = datetime.now(UTC).replace(tzinfo=None) + expires_after
    token = jwt.encode(payload, settings.JWT_SECRET_KEY)
    return token.decode('UTF-8')


def get_token_from_headers() -> str:
    authorization: str = Header(None)
    return authorization.split()[-1]


def get_provider_token_info(access_token: str) -> Tuple[Type['AuthBase'], DictStrAny]:
    cls = get_provider_cls_by_access_token(access_token)
    if cls is None:
        raise UnauthorizedException()
    validation, status_code, message = cls.validate_token(access_token)
    if status_code != 200:
        raise AppException(status_code=status_code, message=message)
    token_info = cls.get_info_from_jwt_token(access_token)
    return cls, token_info


def token_required(f: Callable) -> Callable:
    pass


def role_access_required(*roles_names: str, all_required: bool = False) -> Callable:
    pass
