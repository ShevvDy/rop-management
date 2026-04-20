from fastapi import APIRouter, status, Depends
from typing import List

from ..models import Teacher
from ..schemas import TeacherCreateSchema, TeacherUpdateSchema, TeacherResponseSchema
from ..security import role_required, AdminRole

router = APIRouter(prefix="/teacher", tags=["teacher"])


@router.post("", response_model=TeacherResponseSchema, status_code=status.HTTP_201_CREATED, dependencies=[Depends(role_required(AdminRole))])
async def create_teacher(teacher: TeacherCreateSchema, user=Depends(role_required(AdminRole))):
    """Создать нового преподавателя"""
    return await Teacher.create_node(teacher.model_dump())


@router.get("", response_model=List[TeacherResponseSchema], dependencies=[Depends(role_required())])
async def get_teachers(skip: int = 0, limit: int = 100, user=Depends(role_required())):
    """Получить список всех преподавателей"""
    return await Teacher.get_list(skip=skip, limit=limit, relations=['user', 'faculty'])


@router.get("/{teacher_id}", response_model=TeacherResponseSchema, dependencies=[Depends(role_required())])
async def get_teacher(teacher_id: int, user=Depends(role_required())):
    """Получить преподавателя по ID"""
    return await Teacher.get_by_id(teacher_id, relations=['user', 'faculty'])


@router.put("/{teacher_id}", response_model=TeacherResponseSchema, dependencies=[Depends(role_required(AdminRole))])
async def update_teacher(teacher_id: int, teacher_update: TeacherUpdateSchema, user=Depends(role_required(AdminRole))):
    """Обновить данные преподавателя"""
    teacher = await Teacher.update_node(teacher_id, teacher_update.model_dump(exclude_unset=True))
    await teacher.load_relations('user', 'faculty')
    return teacher


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(role_required(AdminRole))])
async def delete_teacher(teacher_id: int, user=Depends(role_required(AdminRole))):
    """Удалить преподавателя"""
    await Teacher.delete_by_id(teacher_id)
