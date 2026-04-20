from .base import Role
from ...models import User


class GuestRole(Role):
    @classmethod
    async def check_role(cls, user: User) -> bool:
        return True
