from fastapi import APIRouter, status
from typing import List

from ..models import Tag
from ..schemas import TagBaseSchema, TagCreateSchema, TagUpdateSchema

router = APIRouter(prefix="/tag", tags=["tag"])


@router.post("", response_model=TagBaseSchema, status_code=status.HTTP_201_CREATED)
async def create_tag(tag: TagCreateSchema):
    """Создать новый тег"""
    return await Tag.create_node(tag.model_dump())


@router.get("", response_model=List[TagBaseSchema])
async def get_tags(skip: int = 0, limit: int = 100):
    """Получить список всех тегов"""
    return await Tag.get_list(skip=skip, limit=limit)


@router.get("/{tag_id}", response_model=TagBaseSchema)
async def get_tag(tag_id: int):
    """Получить тег по ID"""
    return await Tag.get_by_id(tag_id)


@router.put("/{tag_id}", response_model=TagBaseSchema)
async def update_tag(tag_id: int, tag_update: TagUpdateSchema):
    """Обновить данные тега"""
    return await Tag.update_node(tag_id, tag_update.model_dump(exclude_unset=True))


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(tag_id: int):
    """Удалить тег"""
    await Tag.delete_by_id(tag_id)
