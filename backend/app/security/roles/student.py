from .base import Role
from ...models import Cohort, User


class StudentRole(Role):
    @classmethod
    async def check_role(cls, user: User) -> bool:
        await user.load_relations('student_data.cohort')
        return any(student.is_active() for student in user.student_data)
