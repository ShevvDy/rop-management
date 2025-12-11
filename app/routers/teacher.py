from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..models import Teacher, get_session
from ..schemas import TeacherCreate, TeacherUpdate, TeacherResponse


router = APIRouter(prefix="/teacher", tags=["teacher"])


@router.post("", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher(
    teacher: TeacherCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать нового преподавателя"""
    db_teacher = await Teacher.create(db, teacher.model_dump())
    await db.commit()
    await db.refresh(db_teacher)
    return db_teacher


@router.get("", response_model=List[TeacherResponse])
async def get_teachers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех преподавателей"""
    return await Teacher.get_list(db, skip=skip, limit=limit)


@router.get("/{teacher_id}", response_model=TeacherResponse)
async def get_teacher(
    teacher_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить преподавателя по ID"""
    return await Teacher.get_by_id(db, teacher_id)


@router.put("/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(
    teacher_id: int,
    teacher_update: TeacherUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные преподавателя"""
    teacher = await Teacher.update(
        db,
        teacher_id,
        teacher_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(teacher)
    return teacher


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_teacher(
    teacher_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить преподавателя"""
    await Teacher.delete(db, teacher_id)
    await db.commit()

