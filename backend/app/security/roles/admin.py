from .base import Role
from ...models import User


class AdminRole(Role):
    @classmethod
    async def check_role(cls, user: User) -> bool:
        return user.is_admin
