from .base import Role
from ...models import User


class CohortDirectorRole(Role):
    @classmethod
    async def check_role(cls, user: User) -> bool:
        await user.load_relations('directed_cohorts')
        return len(user.directed_cohorts) > 0
