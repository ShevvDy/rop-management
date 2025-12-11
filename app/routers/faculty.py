from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..models import Faculty, get_session
from ..schemas import FacultyCreate, FacultyUpdate, FacultyResponse


router = APIRouter(prefix="/faculty", tags=["faculty"])


@router.post("", response_model=FacultyResponse, status_code=status.HTTP_201_CREATED)
async def create_faculty(
    faculty: FacultyCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать новый факультет"""
    db_faculty = await Faculty.create(db, faculty.model_dump())
    await db.commit()
    await db.refresh(db_faculty)
    return db_faculty


@router.get("", response_model=List[FacultyResponse])
async def get_faculties(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех факультетов"""
    return await Faculty.get_list(db, skip=skip, limit=limit)


@router.get("/{faculty_id}", response_model=FacultyResponse)
async def get_faculty(
    faculty_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить факультет по ID"""
    return await Faculty.get_by_id(db, faculty_id)


@router.put("/{faculty_id}", response_model=FacultyResponse)
async def update_faculty(
    faculty_id: int,
    faculty_update: FacultyUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные факультета"""
    faculty = await Faculty.update(
        db,
        faculty_id,
        faculty_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(faculty)
    return faculty


@router.delete("/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faculty(
    faculty_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить факультет"""
    await Faculty.delete(db, faculty_id)
    await db.commit()
