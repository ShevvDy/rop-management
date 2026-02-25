from fastapi import APIRouter, status
from typing import List

from ..models import Course
from ..schemas import CourseCreate, CourseUpdate, CourseResponse, CourseWithRelations


router = APIRouter(prefix="/course", tags=["course"])


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(course: CourseCreate):
    """Создать новый курс"""
    return await Course.create_node(course.model_dump())


@router.get("", response_model=List[CourseResponse])
async def get_courses(skip: int = 0, limit: int = 100):
    """Получить список всех курсов"""
    return await Course.get_list(skip=skip, limit=limit)


@router.get("/{course_id}", response_model=CourseWithRelations)
async def get_course(course_id: int):
    """Получить курс по ID"""
    course = await Course.get_by_id(course_id)

    # Загружаем связанные данные
    await course.prerequisites.all()
    await course.tags.all()

    return course


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(course_id: int, course_update: CourseUpdate):
    """Обновить данные курса"""
    return await Course.update_node(course_id, course_update.model_dump(exclude_unset=True))


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(course_id: int):
    """Удалить курс"""
    await Course.delete_by_id(course_id)
