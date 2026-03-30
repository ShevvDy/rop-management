from fastapi import APIRouter, status
from typing import List

from ..models import Cohort
from ..schemas import CohortCreateSchema, CohortUpdateSchema, CohortResponseSchema, CohortWithRelationsSchema

router = APIRouter(prefix="/cohort", tags=["cohort"])


@router.post("", response_model=CohortResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_cohort(cohort: CohortCreateSchema):
    """Создать новый поток по учебному году"""
    return await Cohort.create_node(cohort.model_dump())


@router.get("", response_model=List[CohortResponseSchema])
async def get_cohorts(skip: int = 0, limit: int = 100):
    """Получить список всех потоков по учебным годам"""
    return await Cohort.get_list(skip=skip, limit=limit, relations=['program', 'director', 'manager'])


@router.get("/{cohort_id}", response_model=CohortWithRelationsSchema)
async def get_cohort(cohort_id: int):
    """Получить поток по учебному году по ID"""
    return await Cohort.get_by_id(cohort_id, relations=['program.faculty', 'director', 'manager', 'specializations', 'groups'])


@router.put("/{cohort_id}", response_model=CohortResponseSchema)
async def update_cohort(cohort_id: int, cohort_update: CohortUpdateSchema):
    """Обновить данные потока по учебному году"""
    cohort = await Cohort.update_node(cohort_id, cohort_update.model_dump(exclude_unset=True))
    await cohort.load_relations('program', 'director', 'manager')
    return cohort


@router.delete("/{cohort_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cohort(cohort_id: int):
    """Удалить поток по учебному году"""
    await Cohort.delete_by_id(cohort_id)

