from .base import Role
from ...models import User


class TeacherRole(Role):
    @classmethod
    async def check_role(cls, user: User) -> bool:
        await user.load_relations('teacher_data')
        return any(teacher.is_active() for teacher in user.teacher_data)
