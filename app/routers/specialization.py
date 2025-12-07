from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..models import Specialization, get_session
from ..schemas import SpecializationCreate, SpecializationUpdate, SpecializationResponse


router = APIRouter(prefix="/specialization", tags=["specialization"])


@router.post("/", response_model=SpecializationResponse, status_code=status.HTTP_201_CREATED)
async def create_specialization(
    specialization: SpecializationCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать новую специализацию"""
    db_specialization = await Specialization.create(db, specialization.model_dump())
    await db.commit()
    await db.refresh(db_specialization)
    return db_specialization


@router.get("/", response_model=List[SpecializationResponse])
async def get_specializations(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех специализаций"""
    return await Specialization.get_list(db, skip=skip, limit=limit)


@router.get("/{specialization_id}", response_model=SpecializationResponse)
async def get_specialization(
    specialization_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить специализацию по ID"""
    return await Specialization.get_by_id(db, specialization_id)


@router.patch("/{specialization_id}", response_model=SpecializationResponse)
async def update_specialization(
    specialization_id: int,
    specialization_update: SpecializationUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные специализации"""
    specialization = await Specialization.update(
        db,
        specialization_id,
        specialization_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(specialization)
    return specialization


@router.delete("/{specialization_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_specialization(
    specialization_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить специализацию"""
    await Specialization.delete(db, specialization_id)
    await db.commit()

