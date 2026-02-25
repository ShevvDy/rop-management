from fastapi import APIRouter, status
from typing import List

from ..models import Cohort
from ..schemas import CohortCreate, CohortUpdate, CohortResponse, CohortWithRelations

router = APIRouter(prefix="/cohort", tags=["cohort"])


@router.post("", response_model=CohortResponse, status_code=status.HTTP_201_CREATED)
async def create_cohort(cohort: CohortCreate):
    """Создать новый поток по учебному году"""
    return await Cohort.create_node(cohort.model_dump())


@router.get("", response_model=List[CohortResponse])
async def get_cohorts(skip: int = 0, limit: int = 100):
    """Получить список всех потоков по учебным годам"""
    return await Cohort.get_list(skip=skip, limit=limit)


@router.get("/{cohort_id}", response_model=CohortWithRelations)
async def get_cohort(cohort_id: int):
    """Получить поток по учебному году по ID"""
    cohort = await Cohort.get_by_id(cohort_id)

    # Загружаем связанные данные
    program = await cohort.program.single()
    if program:
        await program.faculty.single()

    await cohort.director.single()
    await cohort.manager.single()
    await cohort.specializations.all()
    await cohort.education_plan.all()

    return cohort


@router.put("/{cohort_id}", response_model=CohortResponse)
async def update_cohort(cohort_id: int, cohort_update: CohortUpdate):
    """Обновить данные потока по учебному году"""
    return await Cohort.update_node(cohort_id, cohort_update.model_dump(exclude_unset=True))


@router.delete("/{cohort_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cohort(cohort_id: int):
    """Удалить поток по учебному году"""
    await Cohort.delete_by_id(cohort_id)

