from fastapi import APIRouter, status
from typing import List

from ..models import Student
from ..schemas import StudentCreateSchema, StudentUpdateSchema, StudentResponseSchema

router = APIRouter(prefix="/student", tags=["student"])


@router.post("", response_model=StudentResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_student(student: StudentCreateSchema):
    """Создать нового студента"""
    student = await Student.create_node(student.model_dump())
    await student.load_relations('cohort.program', 'group.specialization')
    return student


@router.get("", response_model=List[StudentResponseSchema])
async def get_students(skip: int = 0, limit: int = 100):
    """Получить список всех студентов"""
    return await Student.get_list(skip=skip, limit=limit, relations=['user', 'cohort.program', 'group.specialization'])


@router.get("/{student_id}", response_model=StudentResponseSchema)
async def get_student(student_id: int):
    """Получить студента по ID"""
    return await Student.get_by_id(student_id, relations=['user', 'cohort.program', 'group.specialization'])


@router.put("/{student_id}", response_model=StudentResponseSchema)
async def update_student(student_id: int, student_update: StudentUpdateSchema):
    """Обновить данные студента"""
    student = await Student.update_node(student_id, student_update.model_dump(exclude_unset=True))
    await student.load_relations('cohort.program', 'group.specialization')
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(student_id: int):
    """Удалить студента"""
    await Student.delete_by_id(student_id)
