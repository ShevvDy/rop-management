from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..models import Group, get_session
from ..schemas import GroupCreate, GroupUpdate, GroupResponse


router = APIRouter(prefix="/group", tags=["group"])


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group: GroupCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать новую группу"""
    db_group = await Group.create(db, group.model_dump())
    await db.commit()
    await db.refresh(db_group)
    return db_group


@router.get("", response_model=List[GroupResponse])
async def get_groups(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех групп"""
    return await Group.get_list(db, skip=skip, limit=limit)


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить группу по ID"""
    return await Group.get_by_id(db, group_id)


@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: int,
    group_update: GroupUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные группы"""
    group = await Group.update(
        db,
        group_id,
        group_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(group)
    return group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить группу"""
    await Group.delete(db, group_id)
    await db.commit()

