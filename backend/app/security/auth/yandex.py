from typing import Optional

import requests
from urllib.parse import urlencode

from .base import AuthBase
from ...exceptions import UnauthorizedException
from ...utils.types import DictStrAny
from ...settings import settings


class AuthYandex(AuthBase):
    provider_name = 'yandex'

    @classmethod
    def _yandex_token_request(cls, params: DictStrAny) -> DictStrAny:
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        params['client_id'] = settings.YANDEX_CLIENT_ID
        params['client_secret'] = settings.YANDEX_CLIENT_SECRET
        response = requests.post(settings.YANDEX_TOKEN_URL, headers=headers, data=params)
        if response.status_code != 200:
            raise UnauthorizedException()
        data = response.json()
        if 'error_description' in data:
            raise UnauthorizedException(message=data['error_description'])
        return data

    @classmethod
    def get_access_token(cls, *args, **kwargs) -> DictStrAny:
        params = {
            'grant_type': 'authorization_code',
            'code': kwargs.get('code', None),
            'code_verifier': kwargs.get('code_verifier', None),
        }
        return cls._yandex_token_request(params)

    @classmethod
    def get_refresh_token(cls, refresh_token: str, *args, **kwargs) -> DictStrAny:
        params = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
        }
        return cls._yandex_token_request(params)

    @classmethod
    def get_info_from_jwt_token(cls, jwt_token: str) -> Optional[DictStrAny]:
        headers = {'Authorization': f'OAuth {jwt_token}'}
        response = requests.get(settings.YANDEX_INFO_URL, headers=headers)
        if response.status_code != 200:
            return None
        data = response.json()
        if 'error_description' in data:
            return None
        return data

    @classmethod
    def get_provider_user_id(cls, user_info: DictStrAny) -> str:
        return str(user_info['id'])

    @classmethod
    def get_user_model_info(cls, info_from_token: DictStrAny) -> DictStrAny:
        return {
            'provider_user_id': cls.get_provider_user_id(info_from_token),
            'name': info_from_token['first_name'],
            'surname': info_from_token['last_name'],
            'email': info_from_token.get('default_email') or None,
            'phone': (info_from_token.get('default_phone') or {}).get('number') or None,
        }

    @classmethod
    def get_render_data(cls, **kwargs) -> DictStrAny:
        redirect_uri = cls.make_correct_redirect_url()
        url_params = {
            "response_type": "code",
            "client_id": settings.YANDEX_CLIENT_ID,
            "code_challenge_method": "S256",
            "redirect_uri": redirect_uri,
        }
        query_string = urlencode(url_params)
        return {
            'auth_url': f"{settings.YANDEX_AUTH_URL}?{query_string}&code_challenge=" # need to fill on frontend
        }
