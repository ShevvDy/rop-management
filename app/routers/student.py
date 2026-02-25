from fastapi import APIRouter, status
from typing import List

from ..models import Student
from ..schemas import StudentCreate, StudentUpdate, StudentResponse, StudentWithRelations

router = APIRouter(prefix="/student", tags=["student"])


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(student: StudentCreate):
    """Создать нового студента"""
    return await Student.create_node(student.model_dump())


@router.get("", response_model=List[StudentResponse])
async def get_students(skip: int = 0, limit: int = 100):
    """Получить список всех студентов"""
    return await Student.get_list(skip=skip, limit=limit)


@router.get("/{student_id}", response_model=StudentWithRelations)
async def get_student(student_id: int):
    """Получить студента по ID"""
    student = await Student.get_by_id(student_id)

    # Загружаем связанные данные
    await student.user.single()
    await student.cohort.single()
    await student.group.single()
    await student.streams.all()

    return student


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(student_id: int, student_update: StudentUpdate):
    """Обновить данные студента"""
    return await Student.update_node(
        student_id,
        student_update.model_dump(exclude_unset=True)
    )


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(student_id: int):
    """Удалить студента"""
    await Student.delete_by_id(student_id)
