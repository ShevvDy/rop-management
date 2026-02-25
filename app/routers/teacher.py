from fastapi import APIRouter, status
from typing import List

from ..models import Teacher
from ..schemas import TeacherCreate, TeacherUpdate, TeacherResponse, TeacherWithRelations

router = APIRouter(prefix="/teacher", tags=["teacher"])


@router.post("", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher(teacher: TeacherCreate):
    """Создать нового преподавателя"""
    return await Teacher.create_node(teacher.model_dump())


@router.get("", response_model=List[TeacherResponse])
async def get_teachers(skip: int = 0, limit: int = 100):
    """Получить список всех преподавателей"""
    return await Teacher.get_list(skip=skip, limit=limit)


@router.get("/{teacher_id}", response_model=TeacherWithRelations)
async def get_teacher(teacher_id: int):
    """Получить преподавателя по ID"""
    teacher = await Teacher.get_by_id(teacher_id)

    # Загружаем связанные данные
    await teacher.user.single()
    await teacher.faculty.single()

    return teacher


@router.put("/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(teacher_id: int, teacher_update: TeacherUpdate):
    """Обновить данные преподавателя"""
    return await Teacher.update_node(
        teacher_id,
        teacher_update.model_dump(exclude_unset=True)
    )


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_teacher(teacher_id: int):
    """Удалить преподавателя"""
    await Teacher.delete_by_id(teacher_id)
