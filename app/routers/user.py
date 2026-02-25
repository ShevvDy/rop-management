from fastapi import APIRouter, status
from typing import List

from ..models import User
from ..schemas import UserCreate, UserUpdate, UserResponse, UserWithRelations


router = APIRouter(prefix="/user", tags=["user"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """Создать нового пользователя"""
    return await User.create_node(user.model_dump())


@router.get("", response_model=List[UserResponse])
async def get_users(skip: int = 0, limit: int = 100):
    """Получить список всех пользователей"""
    return await User.get_list(skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserWithRelations)
async def get_user(user_id: int):
    """Получить пользователя по ID"""
    user = await User.get_by_id(user_id)

    # Загружаем связанные данные
    await user.student_data.all()
    teacher_data = await user.teacher_data.all()
    await user.directed_cohorts.all()
    await user.managed_cohorts.all()
    await user.tags.all()
    for t in teacher_data:
        await t.taught_streams.all()

    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_update: UserUpdate):
    """Обновить данные пользователя"""
    return await User.update_node(
        user_id,
        user_update.model_dump(exclude_unset=True)
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int):
    """Удалить пользователя"""
    await User.delete_by_id(user_id)
