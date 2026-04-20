from typing import Type

from fastapi import APIRouter

from ..security import AuthBase, get_provider_cls_by_name, get_provider_cls_by_refresh_token
from ..exceptions import BadRequestException, UnauthorizedException
from ..models import User, OAuthProvider
from ..schemas import GetAccessTokenSchema, GetRefreshTokenSchema, TokenResponseSchema
from ..utils.types import DictStrAny

router = APIRouter(prefix="/auth", tags=["auth"])


async def get_data_tokens(provider_cls: Type[AuthBase], tokens: DictStrAny) -> DictStrAny:
    info_from_token = provider_cls.get_info_from_jwt_token(tokens['access_token'])
    if info_from_token is None:
        raise UnauthorizedException()

    result = {'access_token': tokens['access_token'], 'refresh_token': tokens['refresh_token']}
    provider_user_id = provider_cls.get_provider_user_id(info_from_token)
    user = await OAuthProvider.get_user_by_provider_user_id(
        provider_cls.provider_name, provider_user_id  # noqa E1136
    )

    if user is None:
        data = provider_cls.get_user_model_info(info_from_token)
        data['provider'] = provider_cls.provider_name
        user = await User.create_node(data)
    await user.load_relations(
        'tags',
        'student_data.specialization',
        'student_data.cohort.program',
        'teacher_data',
        'directed_cohorts.program',
        'managed_cohorts.program',
    )
    result['user'] = user

    return result


@router.post('/token/refresh', response_model=TokenResponseSchema)
async def get_refresh_token(token_args: GetRefreshTokenSchema):
    args = token_args.model_dump()
    refresh_token = token_args.refresh_token

    provider_cls = get_provider_cls_by_refresh_token(refresh_token)
    if provider_cls is None:
        raise BadRequestException()

    tokens = provider_cls.get_refresh_token(**args)
    result = await get_data_tokens(provider_cls, tokens)

    return result


@router.post('/token/{provider}', response_model=TokenResponseSchema)
async def get_access_token(provider: str, token_args: GetAccessTokenSchema):
    args = token_args.model_dump()
    provider_cls = get_provider_cls_by_name(provider)
    if provider_cls is None:
        raise BadRequestException()

    tokens = provider_cls.get_access_token(**args)
    result = await get_data_tokens(provider_cls, tokens)

    return result



# TODO remove it

def generate_code_verifier():
    import secrets
    import base64
    random_bytes = secrets.token_bytes(64)
    code_verifier = base64.urlsafe_b64encode(random_bytes).rstrip(b'=').decode('utf-8')
    return code_verifier

def generate_code_challenge(code_verifier):
    import base64
    import hashlib
    sha256_hash = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(sha256_hash).rstrip(b'=').decode('utf-8')
    return code_challenge


@router.get('/login', response_model=dict)
def login_view():
    from ..security.auth import AuthYandex
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    render_data = AuthYandex.get_render_data()
    return {
        'code_verifier': code_verifier,
        'code_challenge': code_challenge,
        'auth_url': render_data['auth_url'] + code_challenge,
    }

@router.get('/callback')
def callback_view(code: str, provider: str = 'yandex'):
    from fastapi.responses import RedirectResponse
    from urllib.parse import urlencode
    params = urlencode({'code': code, 'provider': provider})
    return RedirectResponse(url=f'http://localhost:5173/auth/callback?{params}')
