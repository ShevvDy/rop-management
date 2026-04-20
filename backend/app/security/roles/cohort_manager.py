from .base import Role
from ...models import User


class CohortManagerRole(Role):
    @classmethod
    async def check_role(cls, user: User) -> bool:
        await user.load('managed_cohorts')
        return len(user.managed_cohorts) > 0
