from fastapi import APIRouter, status
from typing import List

from ..models import Group
from ..schemas import GroupBaseSchema, GroupCreateSchema, GroupUpdateSchema, GroupResponseSchema, GroupWithRelationsSchema

router = APIRouter(prefix="/group", tags=["group"])


@router.post("", response_model=GroupResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_group(group: GroupCreateSchema):
    """Создать новую группу"""
    group = await Group.create_node(group.model_dump())
    await group.load_relations('cohort.program', 'cohort.director', 'cohort.manager', 'specialization')
    return group


@router.get("", response_model=List[GroupBaseSchema])
async def get_groups(skip: int = 0, limit: int = 100):
    """Получить список всех групп"""
    return await Group.get_list(skip=skip, limit=limit)


@router.get("/{group_id}", response_model=GroupWithRelationsSchema)
async def get_group(group_id: int):
    """Получить группу по ID"""
    return await Group.get_by_id(group_id, relations=['cohort.program', 'cohort.director', 'cohort.manager', 'specialization', 'students.user'])


@router.put("/{group_id}", response_model=GroupResponseSchema)
async def update_group(group_id: int, group_update: GroupUpdateSchema):
    """Обновить данные группы"""
    group = await Group.update_node(group_id, group_update.model_dump(exclude_unset=True))
    await group.load_relations('cohort.program', 'cohort.director', 'cohort.manager', 'specialization')
    return group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(group_id: int):
    """Удалить группу"""
    await Group.delete_by_id(group_id)
