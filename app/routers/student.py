from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List

from ..models import Student, get_session
from ..schemas import StudentCreate, StudentUpdate, StudentResponse, StudentWithRelations


router = APIRouter(prefix="/student", tags=["student"])


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student: StudentCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать нового студента"""
    db_student = await Student.create(db, student.model_dump())
    await db.commit()
    await db.refresh(db_student)
    return db_student


@router.get("", response_model=List[StudentResponse])
async def get_students(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех студентов"""
    return await Student.get_list(db, skip=skip, limit=limit)


@router.get("/{student_id}", response_model=StudentWithRelations)
async def get_student(
    student_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить студента по ID"""
    return await Student.get_by_id(
        db, student_id, load_relations=[
            selectinload(Student.user),
            selectinload(Student.cohort),
            selectinload(Student.group),
            selectinload(Student.streams)
        ]
    )


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_update: StudentUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные студента"""
    student = await Student.update(
        db,
        student_id,
        student_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(student)
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить студента"""
    await Student.delete(db, student_id)
    await db.commit()
