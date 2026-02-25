from fastapi import APIRouter, status
from typing import List

from ..models import Group
from ..schemas import GroupCreate, GroupUpdate, GroupResponse, GroupWithRelations

router = APIRouter(prefix="/group", tags=["group"])


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(group: GroupCreate):
    """Создать новую группу"""
    return await Group.create_node(group.model_dump())


@router.get("", response_model=List[GroupResponse])
async def get_groups(skip: int = 0, limit: int = 100):
    """Получить список всех групп"""
    return await Group.get_list(skip=skip, limit=limit)


@router.get("/{group_id}", response_model=GroupWithRelations)
async def get_group(group_id: int):
    """Получить группу по ID"""
    group = await Group.get_by_id(group_id)

    # Загружаем связанные данные
    await group.program.single()
    await group.specialization.single()
    await group.students.all()

    return group


@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(group_id: int, group_update: GroupUpdate):
    """Обновить данные группы"""
    return await Group.update_node(
        group_id,
        group_update.model_dump(exclude_unset=True)
    )


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(group_id: int):
    """Удалить группу"""
    await Group.delete_by_id(group_id)
