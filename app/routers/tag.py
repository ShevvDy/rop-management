from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..models import Tag, get_session
from ..schemas import TagCreate, TagUpdate, TagResponse


router = APIRouter(prefix="/tag", tags=["tag"])


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag: TagCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать новый тег"""
    db_tag = await Tag.create(db, tag.model_dump())
    await db.commit()
    await db.refresh(db_tag)
    return db_tag


@router.get("", response_model=List[TagResponse])
async def get_tags(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех тегов"""
    return await Tag.get_list(db, skip=skip, limit=limit)


@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить тег по ID"""
    return await Tag.get_by_id(db, tag_id)


@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: int,
    tag_update: TagUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные тега"""
    tag = await Tag.update(
        db,
        tag_id,
        tag_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить тег"""
    await Tag.delete(db, tag_id)
    await db.commit()

