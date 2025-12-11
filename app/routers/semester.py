from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..models import Semester, get_session
from ..schemas import SemesterCreate, SemesterUpdate, SemesterResponse


router = APIRouter(prefix="/semester", tags=["semester"])


@router.post("", response_model=SemesterResponse, status_code=status.HTTP_201_CREATED)
async def create_semester(
    semester: SemesterCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать новый семестр"""
    db_semester = await Semester.create(db, semester.model_dump())
    await db.commit()
    await db.refresh(db_semester)
    return db_semester


@router.get("", response_model=List[SemesterResponse])
async def get_semesters(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех семестров"""
    return await Semester.get_list(db, skip=skip, limit=limit)


@router.get("/{semester_id}", response_model=SemesterResponse)
async def get_semester(
    semester_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить семестр по ID"""
    return await Semester.get_by_id(db, semester_id)


@router.put("/{semester_id}", response_model=SemesterResponse)
async def update_semester(
    semester_id: int,
    semester_update: SemesterUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные семестра"""
    semester = await Semester.update(
        db,
        semester_id,
        semester_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(semester)
    return semester


@router.delete("/{semester_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_semester(
    semester_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить семестр"""
    await Semester.delete(db, semester_id)
    await db.commit()

