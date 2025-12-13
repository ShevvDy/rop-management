from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List

from ..models import Stream, get_session
from ..schemas import StreamCreate, StreamUpdate, StreamResponse, StreamWithRelations


router = APIRouter(prefix="/stream", tags=["stream"])


@router.post("", response_model=StreamResponse, status_code=status.HTTP_201_CREATED)
async def create_stream(
    stream: StreamCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать новый поток"""
    db_stream = await Stream.create(db, stream.model_dump())
    await db.commit()
    await db.refresh(db_stream)
    return db_stream


@router.get("", response_model=List[StreamResponse])
async def get_streams(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех потоков"""
    return await Stream.get_list(db, skip=skip, limit=limit)


@router.get("/{stream_id}", response_model=StreamWithRelations)
async def get_stream(
    stream_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить поток по ID"""
    return await Stream.get_by_id(
        db, stream_id, load_relations=[
            selectinload(Stream.semester),
            selectinload(Stream.course),
            selectinload(Stream.teacher),
            selectinload(Stream.students)
        ]
    )


@router.put("/{stream_id}", response_model=StreamResponse)
async def update_stream(
    stream_id: int,
    stream_update: StreamUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные потока"""
    stream = await Stream.update(
        db,
        stream_id,
        stream_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(stream)
    return stream


@router.delete("/{stream_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stream(
    stream_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить поток"""
    await Stream.delete(db, stream_id)
    await db.commit()
