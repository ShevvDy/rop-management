from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List

from ..models import User, get_session
from ..schemas import UserCreate, UserUpdate, UserResponse, UserWithRelations


router = APIRouter(prefix="/user", tags=["user"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать нового пользователя"""
    db_user = await User.create(db, user.model_dump())
    await db.commit()
    await db.refresh(db_user)
    return db_user


@router.get("", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех пользователей"""
    return await User.get_list(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserWithRelations)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить пользователя по ID"""
    return await User.get_by_id(
        db, user_id, load_relations=[
            selectinload(User.student_data),
            selectinload(User.teacher_data),
            selectinload(User.directed_cohorts),
            selectinload(User.managed_cohorts),
            selectinload(User.tags),
            selectinload(User.teacher_streams)
        ]
    )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные пользователя"""
    user = await User.update(
        db,
        user_id,
        user_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить пользователя"""
    await User.delete(db, user_id)
    await db.commit()
