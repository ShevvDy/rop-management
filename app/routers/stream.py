from fastapi import APIRouter, status
from typing import List

from ..models import Stream
from ..schemas import StreamCreate, StreamUpdate, StreamResponse, StreamWithRelations

router = APIRouter(prefix="/stream", tags=["stream"])


@router.post("", response_model=StreamResponse, status_code=status.HTTP_201_CREATED)
async def create_stream(stream: StreamCreate):
    """Создать новый поток"""
    return await Stream.create_node(stream.model_dump())


@router.get("", response_model=List[StreamResponse])
async def get_streams(skip: int = 0, limit: int = 100):
    """Получить список всех потоков"""
    return await Stream.get_list(skip=skip, limit=limit)


@router.get("/{stream_id}", response_model=StreamWithRelations)
async def get_stream(stream_id: int):
    """Получить поток по ID"""
    stream = await Stream.get_by_id(stream_id)

    # Загружаем связанные данные
    await stream.semester.single()
    await stream.course.single()
    await stream.teacher.single()
    await stream.students.all()

    return stream


@router.put("/{stream_id}", response_model=StreamResponse)
async def update_stream(stream_id: int, stream_update: StreamUpdate):
    """Обновить данные потока"""
    return await Stream.update_node(
        stream_id,
        stream_update.model_dump(exclude_unset=True)
    )


@router.delete("/{stream_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stream(stream_id: int):
    """Удалить поток"""
    await Stream.delete_by_id(stream_id)
