from fastapi import APIRouter, status, Depends
from typing import List

from ..models import User
from ..schemas import UserCreateSchema, UserUpdateSchema, UserResponseSchema, UserWithRelationsSchema
from ..security import role_required, AdminRole


router = APIRouter(prefix="/user", tags=["user"])


@router.post("", response_model=UserResponseSchema, status_code=status.HTTP_201_CREATED, dependencies=[Depends(role_required(AdminRole))])
async def create_user(user: UserCreateSchema, user_obj=Depends(role_required(AdminRole))):
    """Создать нового пользователя"""
    return await User.create_node(user.model_dump())


@router.get("", response_model=List[UserWithRelationsSchema], dependencies=[Depends(role_required())])
async def get_users(skip: int = 0, limit: int = 100, user=Depends(role_required())):
    """Получить список всех пользователей"""
    users_list = await User.get_list(
        skip=skip,
        limit=limit,
        relations=[
            'tags',
            'student_data.specialization',
            'student_data.cohort.program',
            'teacher_data',
            'directed_cohorts.program',
            'managed_cohorts.program',
        ]
    )
    return users_list


@router.get("/{user_id}", response_model=UserWithRelationsSchema, dependencies=[Depends(role_required())])
async def get_user(user_id: int, user=Depends(role_required())):
    """Получить пользователя по ID"""
    return await User.get_by_id(
        user_id,
        relations=[
            'tags',
            'student_data.specialization',
            'student_data.cohort.program',
            'teacher_data',
            'directed_cohorts.program',
            'managed_cohorts.program',
        ]
    )


@router.put("/{user_id}", response_model=UserResponseSchema, dependencies=[Depends(role_required(AdminRole))])
async def update_user(user_id: int, user_update: UserUpdateSchema, user=Depends(role_required(AdminRole))):
    """Обновить данные пользователя"""
    user = await User.update_node(user_id, user_update.model_dump(exclude_unset=True))
    await user.load_relations('tags')
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(role_required(AdminRole))])
async def delete_user(user_id: int, user=Depends(role_required(AdminRole))):
    """Удалить пользователя"""
    await User.delete_by_id(user_id)
