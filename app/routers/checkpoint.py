from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List

from ..models import Checkpoint, get_session
from ..schemas import CheckpointCreate, CheckpointUpdate, CheckpointResponse, CheckpointWithRelations


router = APIRouter(prefix="/checkpoint", tags=["checkpoint"])


@router.post("", response_model=CheckpointResponse, status_code=status.HTTP_201_CREATED)
async def create_checkpoint(
    checkpoint: CheckpointCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать новый чекпоинт"""
    db_checkpoint = await Checkpoint.create(db, checkpoint.model_dump())
    await db.commit()
    await db.refresh(db_checkpoint)
    return db_checkpoint


@router.get("", response_model=List[CheckpointResponse])
async def get_checkpoints(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех чекпоинтов"""
    return await Checkpoint.get_list(db, skip=skip, limit=limit)


@router.get("/{checkpoint_id}", response_model=CheckpointWithRelations)
async def get_checkpoint(
    checkpoint_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить чекпоинт по ID"""
    return await Checkpoint.get_by_id(
        db, checkpoint_id, load_relations=[
            selectinload(Checkpoint.stream),
            selectinload(Checkpoint.tags)
        ]
    )


@router.put("/{checkpoint_id}", response_model=CheckpointResponse)
async def update_checkpoint(
    checkpoint_id: int,
    checkpoint_update: CheckpointUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные чекпоинта"""
    checkpoint = await Checkpoint.update(
        db,
        checkpoint_id,
        checkpoint_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(checkpoint)
    return checkpoint


@router.delete("/{checkpoint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checkpoint(
    checkpoint_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить чекпоинт"""
    await Checkpoint.delete(db, checkpoint_id)
    await db.commit()

