from fastapi import APIRouter, status, Depends
from typing import List

from ..models import Specialization
from ..schemas import SpecializationCreateSchema, SpecializationUpdateSchema, SpecializationResponseSchema
from ..security import role_required, AdminRole

router = APIRouter(prefix="/specialization", tags=["specialization"])


@router.post("", response_model=SpecializationResponseSchema, status_code=status.HTTP_201_CREATED, dependencies=[Depends(role_required(AdminRole))])
async def create_specialization(specialization_create: SpecializationCreateSchema, user=Depends(role_required(AdminRole))):
    """Создать новую специализацию"""
    specialization = await Specialization.create_node(specialization_create.model_dump())
    await specialization.load_relations('cohort.program', 'cohort.director', 'cohort.manager')
    return specialization


@router.get("", response_model=List[SpecializationResponseSchema], dependencies=[Depends(role_required())])
async def get_specializations(skip: int = 0, limit: int = 100, user=Depends(role_required())):
    """Получить список всех специализаций"""
    return await Specialization.get_list(skip=skip, limit=limit, relations=['cohort.program'])


@router.get("/{specialization_id}", response_model=SpecializationResponseSchema, dependencies=[Depends(role_required())])
async def get_specialization(specialization_id: int, user=Depends(role_required())):
    """Получить специализацию по ID"""
    return await Specialization.get_by_id(specialization_id, relations=['cohort.program'])


@router.put("/{specialization_id}", response_model=SpecializationResponseSchema, dependencies=[Depends(role_required(AdminRole))])
async def update_specialization(specialization_id: int, specialization_update: SpecializationUpdateSchema, user=Depends(role_required(AdminRole))):
    """Обновить данные специализации"""
    return await Specialization.update_node(specialization_id, specialization_update.model_dump(exclude_unset=True))


@router.delete("/{specialization_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(role_required(AdminRole))])
async def delete_specialization(specialization_id: int, user=Depends(role_required(AdminRole))):
    """Удалить специализацию"""
    await Specialization.delete_by_id(specialization_id)
