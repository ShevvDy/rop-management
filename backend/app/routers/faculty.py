from fastapi import APIRouter, status, Depends
from typing import List

from ..models import Faculty
from ..schemas import FacultyBaseSchema, FacultyCreateSchema, FacultyUpdateSchema, FacultyResponseSchema
from ..security import role_required, AdminRole

router = APIRouter(prefix="/faculty", tags=["faculty"])


@router.post("", response_model=FacultyBaseSchema, status_code=status.HTTP_201_CREATED, dependencies=[Depends(role_required(AdminRole))])
async def create_faculty(faculty: FacultyCreateSchema, user=Depends(role_required(AdminRole))):
    """Создать новый факультет"""
    return await Faculty.create_node(faculty.model_dump())


@router.get("", response_model=List[FacultyResponseSchema], dependencies=[Depends(role_required())])
async def get_faculties(skip: int = 0, limit: int = 100, user=Depends(role_required())):
    """Получить список всех факультетов"""
    return await Faculty.get_list(skip=skip, limit=limit, relations=['programs'])


@router.get("/{faculty_id}", response_model=FacultyResponseSchema, dependencies=[Depends(role_required())])
async def get_faculty(faculty_id: int, user=Depends(role_required())):
    """Получить факультет по ID"""
    return await Faculty.get_by_id(faculty_id, relations=['programs'])


@router.put("/{faculty_id}", response_model=FacultyBaseSchema, dependencies=[Depends(role_required(AdminRole))])
async def update_faculty(faculty_id: int, faculty_update: FacultyUpdateSchema, user=Depends(role_required(AdminRole))):
    """Обновить данные факультета"""
    return await Faculty.update_node(
        faculty_id,
        faculty_update.model_dump(exclude_unset=True)
    )


@router.delete("/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(role_required(AdminRole))])
async def delete_faculty(faculty_id: int, user=Depends(role_required(AdminRole))):
    """Удалить факультет"""
    await Faculty.delete_by_id(faculty_id)
