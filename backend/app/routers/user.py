from fastapi import APIRouter, status
from typing import List

from ..models import User
from ..schemas import UserCreateSchema, UserUpdateSchema, UserResponseSchema, UserWithRelationsSchema


router = APIRouter(prefix="/user", tags=["user"])


@router.post("", response_model=UserResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreateSchema):
    """Создать нового пользователя"""
    return await User.create_node(user.model_dump())


@router.get("", response_model=List[UserWithRelationsSchema])
async def get_users(skip: int = 0, limit: int = 100):
    """Получить список всех пользователей"""
    return await User.get_list(
        skip=skip,
        limit=limit,
        relations=[
            'tags',
            'student_data.group',
            'student_data.cohort.program',
            'teacher_data',
            'directed_cohorts.program',
            'managed_cohorts.program',
        ]
    )


@router.get("/{user_id}", response_model=UserWithRelationsSchema)
async def get_user(user_id: int):
    """Получить пользователя по ID"""
    return await User.get_by_id(
        user_id,
        relations=[
            'tags',
            'student_data.group',
            'student_data.cohort.program',
            'teacher_data',
            'directed_cohorts.program',
            'managed_cohorts.program',
        ]
    )


@router.put("/{user_id}", response_model=UserResponseSchema)
async def update_user(user_id: int, user_update: UserUpdateSchema):
    """Обновить данные пользователя"""
    user = await User.update_node(user_id, user_update.model_dump(exclude_unset=True))
    await user.load_relations('tags')
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int):
    """Удалить пользователя"""
    await User.delete_by_id(user_id)
