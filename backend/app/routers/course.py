from fastapi import APIRouter, status, Depends
from typing import List

from ..models import Course, Cohort
from ..schemas import CourseBaseSchema, CourseCreateSchema, CourseUpdateSchema, CourseResponseSchema
from ..security import role_required, check_access_to_cohort_or_fail, AdminRole, CohortDirectorRole, CohortManagerRole


router = APIRouter(prefix="/course", tags=["course"])


@router.post("", response_model=CourseResponseSchema, status_code=status.HTTP_201_CREATED, dependencies=[Depends(role_required(AdminRole, CohortDirectorRole, CohortManagerRole))])
async def create_course(course_create: CourseCreateSchema, user=Depends(role_required(AdminRole, CohortDirectorRole, CohortManagerRole))):
    """Создать новый курс"""
    cohort = await Cohort.get_by_id(course_create.cohort_id)
    await check_access_to_cohort_or_fail(user, cohort)
    course = await Course.create_node(course_create.model_dump())
    await course.load_relations('elective_students.user', 'teachers.user')
    return course


@router.get("", response_model=List[CourseBaseSchema], dependencies=[Depends(role_required())])
async def get_courses(skip: int = 0, limit: int = 100, user=Depends(role_required())):
    """Получить список всех курсов"""
    return await Course.get_list(skip=skip, limit=limit)


@router.get("/{course_id}", response_model=CourseResponseSchema, dependencies=[Depends(role_required())])
async def get_course(course_id: int, user=Depends(role_required())):
    """Получить курс по ID"""
    return await Course.get_by_id(course_id, relations=['cohort', 'specialization', 'prerequisites', 'elective_students.user', 'tags', 'teachers.user'])


@router.put("/{course_id}", response_model=CourseResponseSchema, dependencies=[Depends(role_required(AdminRole, CohortDirectorRole, CohortManagerRole))])
async def update_course(course_id: int, course_update: CourseUpdateSchema, user=Depends(role_required(AdminRole, CohortDirectorRole, CohortManagerRole))):
    """Обновить данные курса"""
    course = await Course.get_by_id(course_id, relations=['cohort'])
    await check_access_to_cohort_or_fail(user, course.cohort)
    course = await Course.update_node(course_id, course_update.model_dump(exclude_unset=True))
    await course.load_relations('cohort', 'elective_students.user', 'teachers.user')
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(role_required(AdminRole, CohortDirectorRole, CohortManagerRole))])
async def delete_course(course_id: int, user=Depends(role_required(AdminRole, CohortDirectorRole, CohortManagerRole))):
    """Удалить курс"""
    course = await Course.get_by_id(course_id, relations=['cohort'])
    await check_access_to_cohort_or_fail(user, course.cohort)
    await Course.delete_by_id(course_id)
