from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..models import Course, get_session
from ..schemas import CourseCreate, CourseUpdate, CourseResponse


router = APIRouter(prefix="/course", tags=["course"])


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course: CourseCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать новый курс"""
    db_course = await Course.create(db, course.model_dump())
    await db.commit()
    await db.refresh(db_course)
    return db_course


@router.get("", response_model=List[CourseResponse])
async def get_courses(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех курсов"""
    return await Course.get_list(db, skip=skip, limit=limit)


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить курс по ID"""
    return await Course.get_by_id(db, course_id)


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_update: CourseUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные курса"""
    course = await Course.update(
        db,
        course_id,
        course_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить курс"""
    await Course.delete(db, course_id)
    await db.commit()

