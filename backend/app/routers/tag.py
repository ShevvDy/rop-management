from fastapi import APIRouter, status, Depends
from typing import List

from ..models import Tag
from ..schemas import TagBaseSchema, TagCreateSchema, TagUpdateSchema
from ..security import role_required, AdminRole

router = APIRouter(prefix="/tag", tags=["tag"])


@router.post("", response_model=TagBaseSchema, status_code=status.HTTP_201_CREATED, dependencies=[Depends(role_required(AdminRole))])
async def create_tag(tag: TagCreateSchema, user=Depends(role_required(AdminRole))):
    """Создать новый тег"""
    return await Tag.create_node(tag.model_dump())


@router.get("", response_model=List[TagBaseSchema], dependencies=[Depends(role_required())])
async def get_tags(skip: int = 0, limit: int = 100, user=Depends(role_required())):
    """Получить список всех тегов"""
    return await Tag.get_list(skip=skip, limit=limit)


@router.get("/{tag_id}", response_model=TagBaseSchema, dependencies=[Depends(role_required())])
async def get_tag(tag_id: int, user=Depends(role_required())):
    """Получить тег по ID"""
    return await Tag.get_by_id(tag_id)


@router.put("/{tag_id}", response_model=TagBaseSchema, dependencies=[Depends(role_required(AdminRole))])
async def update_tag(tag_id: int, tag_update: TagUpdateSchema, user=Depends(role_required(AdminRole))):
    """Обновить данные тега"""
    return await Tag.update_node(tag_id, tag_update.model_dump(exclude_unset=True))


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(role_required(AdminRole))])
async def delete_tag(tag_id: int, user=Depends(role_required(AdminRole))):
    """Удалить тег"""
    await Tag.delete_by_id(tag_id)
