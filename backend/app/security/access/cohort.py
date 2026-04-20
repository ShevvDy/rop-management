from ..roles import AdminRole
from ...exceptions import ForbiddenException
from ...models import User, Cohort


async def check_access_to_cohort(user: User, cohort: Cohort) -> bool:
    """
    Проверить, имеет ли пользователь доступ к когорте

    Логика доступа:
    - Админ имеет доступ ко всем когортам
    - Директор когорты имеет доступ к своим когортам
    - Менеджер когорты имеет доступ к своим когортам
    - Студент имеет доступ к когортам, в которых он записан

    Args:
        user: Объект пользователя
        cohort: Объект когорты

    Returns:
        True если доступ разрешен, иначе False
    """
    # Админ имеет доступ ко всем когортам
    if await AdminRole.check_role(user):
        return True

    # Загружаем необходимые связи пользователя
    await user.load_relations('directed_cohorts', 'managed_cohorts', 'student_data.cohort')

    # Директор когорты
    if any(c.cohort_id == cohort.cohort_id for c in user.directed_cohorts):
        return True

    # Менеджер когорты
    if any(c.cohort_id == cohort.cohort_id for c in user.managed_cohorts):
        return True

    # Студент когорты
    if any(s.cohort.cohort_id == cohort.cohort_id for s in user.student_data):
        return True

    return False


async def check_access_to_cohort_or_fail(user: User, cohort: Cohort) -> None:
    """
    Проверить доступ и выбросить исключение если доступа нет

    Args:
        user: Объект пользователя
        cohort: Объект когорты

    Raises:
        ForbiddenException: Если пользователь не имеет доступа к когорте
    """
    has_access = await check_access_to_cohort(user, cohort)
    if not has_access:
        raise ForbiddenException()
