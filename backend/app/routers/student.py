from fastapi import APIRouter, status, Depends
from typing import List

from ..models import Student
from ..schemas import StudentCreateSchema, StudentUpdateSchema, StudentResponseSchema
from ..security import role_required, AdminRole

router = APIRouter(prefix="/student", tags=["student"])


@router.post("", response_model=StudentResponseSchema, status_code=status.HTTP_201_CREATED, dependencies=[Depends(role_required(AdminRole))])
async def create_student(student: StudentCreateSchema, user=Depends(role_required(AdminRole))):
    """Создать нового студента"""
    student = await Student.create_node(student.model_dump())
    await student.load_relations('cohort.program', 'specialization')
    return student


@router.get("", response_model=List[StudentResponseSchema], dependencies=[Depends(role_required())])
async def get_students(skip: int = 0, limit: int = 100, user=Depends(role_required())):
    """Получить список всех студентов"""
    return await Student.get_list(skip=skip, limit=limit, relations=['user', 'cohort.program', 'specialization'])


@router.get("/{student_id}", response_model=StudentResponseSchema, dependencies=[Depends(role_required())])
async def get_student(student_id: int, user=Depends(role_required())):
    """Получить студента по ID"""
    return await Student.get_by_id(student_id, relations=['user', 'cohort.program', 'specialization'])


@router.put("/{student_id}", response_model=StudentResponseSchema, dependencies=[Depends(role_required(AdminRole))])
async def update_student(student_id: int, student_update: StudentUpdateSchema, user=Depends(role_required(AdminRole))):
    """Обновить данные студента"""
    student = await Student.update_node(student_id, student_update.model_dump(exclude_unset=True))
    await student.load_relations('cohort.program', 'specialization')
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(role_required(AdminRole))])
async def delete_student(student_id: int, user=Depends(role_required(AdminRole))):
    """Удалить студента"""
    await Student.delete_by_id(student_id)
