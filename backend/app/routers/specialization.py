from fastapi import APIRouter, status
from typing import List

from ..models import Specialization
from ..schemas import SpecializationCreateSchema, SpecializationUpdateSchema, SpecializationResponseSchema, SpecializationWithRelationsSchema

router = APIRouter(prefix="/specialization", tags=["specialization"])


@router.post("", response_model=SpecializationResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_specialization(specialization: SpecializationCreateSchema):
    """Создать новую специализацию"""
    return await Specialization.create_node(specialization.model_dump())


@router.get("", response_model=List[SpecializationResponseSchema])
async def get_specializations(skip: int = 0, limit: int = 100):
    """Получить список всех специализаций"""
    return await Specialization.get_list(skip=skip, limit=limit, relations=['cohort.program'])


@router.get("/{specialization_id}", response_model=SpecializationWithRelationsSchema)
async def get_specialization(specialization_id: int):
    """Получить специализацию по ID"""
    return await Specialization.get_by_id(specialization_id, relations=['cohort.program', 'groups', 'education_plan'])


@router.put("/{specialization_id}", response_model=SpecializationResponseSchema)
async def update_specialization(specialization_id: int, specialization_update: SpecializationUpdateSchema):
    """Обновить данные специализации"""
    return await Specialization.update_node(specialization_id, specialization_update.model_dump(exclude_unset=True))


@router.delete("/{specialization_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_specialization(specialization_id: int):
    """Удалить специализацию"""
    await Specialization.delete_by_id(specialization_id)
