from ...models import User

class Role:
    @classmethod
    async def check_role(cls, user: User) -> bool:
        raise NotImplementedError("Subclasses must implement this method")
