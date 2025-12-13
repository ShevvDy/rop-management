from fastapi import APIRouter, Depends, status
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import Cohort, Program, get_session
from ..schemas import CohortCreate, CohortUpdate, CohortResponse, CohortWithRelations


router = APIRouter(prefix="/cohort", tags=["cohort"])


@router.post("", response_model=CohortResponse, status_code=status.HTTP_201_CREATED)
async def create_cohort(
    cohort: CohortCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать новый поток по учебному году"""
    db_cohort = await Cohort.create(db, cohort.model_dump())
    await db.commit()
    await db.refresh(db_cohort)
    return db_cohort


@router.get("", response_model=List[CohortResponse])
async def get_cohorts(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех потоков по учебным годам"""
    return await Cohort.get_list(db, skip=skip, limit=limit)


@router.get("/{cohort_id}", response_model=CohortWithRelations)
async def get_cohort(
    cohort_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить поток по учебному году по ID"""
    return await Cohort.get_by_id(
        db,
        cohort_id,
        load_relations=[
            selectinload(Cohort.program).selectinload(Program.faculty),
            selectinload(Cohort.director),
            selectinload(Cohort.manager),
            selectinload(Cohort.specializations),
            selectinload(Cohort.education_plan),
        ],
    )


@router.put("/{cohort_id}", response_model=CohortResponse)
async def update_cohort(
    cohort_id: int,
    cohort_update: CohortUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные потока по учебному году"""
    cohort = await Cohort.update(
        db,
        cohort_id,
        cohort_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(cohort)
    return cohort


@router.delete("/{cohort_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cohort(
    cohort_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить поток по учебному году"""
    await Cohort.delete(db, cohort_id)
    await db.commit()

