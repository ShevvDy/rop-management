from fastapi import APIRouter, status
from typing import List

from ..models import Semester
from ..schemas import SemesterBaseSchema, SemesterCreateSchema, SemesterUpdateSchema

router = APIRouter(prefix="/semester", tags=["semester"])


@router.post("", response_model=SemesterBaseSchema, status_code=status.HTTP_201_CREATED)
async def create_semester(semester: SemesterCreateSchema):
    """Создать новый семестр"""
    return await Semester.create_node(semester.model_dump())


@router.get("", response_model=List[SemesterBaseSchema])
async def get_semesters(skip: int = 0, limit: int = 100):
    """Получить список всех семестров"""
    return await Semester.get_list(skip=skip, limit=limit)


@router.get("/{semester_id}", response_model=SemesterBaseSchema)
async def get_semester(semester_id: int):
    """Получить семестр по ID"""
    return await Semester.get_by_id(semester_id)


@router.put("/{semester_id}", response_model=SemesterBaseSchema)
async def update_semester(semester_id: int, semester_update: SemesterUpdateSchema):
    """Обновить данные семестра"""
    return await Semester.update_node(
        semester_id,
        semester_update.model_dump(exclude_unset=True)
    )


@router.delete("/{semester_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_semester(semester_id: int):
    """Удалить семестр"""
    await Semester.delete_by_id(semester_id)
