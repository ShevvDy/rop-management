from fastapi import APIRouter, status
from typing import List

from ..models import Course
from ..schemas import CourseBaseSchema, CourseCreateSchema, CourseUpdateSchema, CourseResponseSchema


router = APIRouter(prefix="/course", tags=["course"])


@router.post("", response_model=CourseResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_course(course_create: CourseCreateSchema):
    """Создать новый курс"""
    course = await Course.create_node(course_create.model_dump())
    await course.load_relations('elective_students.user')
    return course


@router.get("", response_model=List[CourseBaseSchema])
async def get_courses(skip: int = 0, limit: int = 100):
    """Получить список всех курсов"""
    return await Course.get_list(skip=skip, limit=limit)


@router.get("/{course_id}", response_model=CourseResponseSchema)
async def get_course(course_id: int):
    """Получить курс по ID"""
    return await Course.get_by_id(course_id, relations=['cohort', 'specialization', 'prerequisites', 'elective_students.user', 'tags'])


@router.put("/{course_id}", response_model=CourseResponseSchema)
async def update_course(course_id: int, course_update: CourseUpdateSchema):
    """Обновить данные курса"""
    course = await Course.update_node(course_id, course_update.model_dump(exclude_unset=True))
    await course.load_relations('cohort', 'elective_students.user')
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(course_id: int):
    """Удалить курс"""
    await Course.delete_by_id(course_id)
