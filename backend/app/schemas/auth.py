from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class GetAccessTokenSchema(BaseModel):
    code: str = Field(..., description="Authorization code from the provider")
    code_verifier: Optional[str] = Field(None, description="Code verifier for PKCE flow")

    model_config = ConfigDict(from_attributes=True)


class GetRefreshTokenSchema(BaseModel):
    refresh_token: str = Field(..., description="Refresh token to obtain a new access token")

    model_config = ConfigDict(from_attributes=True)


class TokenResponseSchema(BaseModel):
    from .user import UserWithRelationsSchema
    UserWithRelationsSchema: ClassVar

    access_token: str = Field(..., description="JWT access token for authentication")
    refresh_token: str = Field(..., description="Token used to refresh the access token")
    user: UserWithRelationsSchema = Field(..., description="Authenticated user information")

    model_config = ConfigDict(from_attributes=True)
