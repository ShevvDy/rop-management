from http import HTTPStatus
from typing import Optional

from jwcrypto.jwt import JWT, json_decode

from ...utils.types import DictStrAny


class AuthBase:
    provider_name: str = None

    @classmethod
    def get_info_from_jwt_token(cls, jwt_token: str) -> Optional[DictStrAny]:
        return json_decode(JWT(jwt=jwt_token).token.objects['payload'])

    @classmethod
    def get_provider_user_id(cls, user_info: DictStrAny) -> str:
        return user_info['user_id']

    @classmethod
    def get_access_token(cls, *args, **kwargs) -> DictStrAny:
        raise NotImplementedError

    @classmethod
    def get_refresh_token(cls, refresh_token: str, *args, **kwargs) -> DictStrAny:
        raise NotImplementedError

    @classmethod
    def validate_token(cls, token: str) -> tuple[Optional[DictStrAny], int, Optional[str]]:
        info = cls.get_info_from_jwt_token(token)
        if info is None:
            return None, HTTPStatus.BAD_REQUEST, 'Invalid token supplied'
        return info, HTTPStatus.OK, None

    @classmethod
    def get_user_model_info(cls, info_from_token: DictStrAny) -> DictStrAny:
        raise NotImplementedError

    @classmethod
    def get_render_data(cls, **kwargs) -> DictStrAny:
        return {}

    @classmethod
    def make_correct_redirect_url(cls) -> str:
        return f'http://localhost:5000/api/v1/auth/callback?provider={cls.provider_name}'
