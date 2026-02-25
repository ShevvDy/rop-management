from fastapi import APIRouter, status
from typing import List

from ..models import Faculty
from ..schemas import FacultyCreate, FacultyUpdate, FacultyResponse, FacultyWithRelations

router = APIRouter(prefix="/faculty", tags=["faculty"])


@router.post("", response_model=FacultyResponse, status_code=status.HTTP_201_CREATED)
async def create_faculty(faculty: FacultyCreate):
    """Создать новый факультет"""
    return await Faculty.create_node(faculty.model_dump())


@router.get("", response_model=List[FacultyResponse])
async def get_faculties(skip: int = 0, limit: int = 100):
    """Получить список всех факультетов"""
    return await Faculty.get_list(skip=skip, limit=limit)


@router.get("/{faculty_id}", response_model=FacultyWithRelations)
async def get_faculty(faculty_id: int):
    """Получить факультет по ID"""
    faculty = await Faculty.get_by_id(faculty_id)

    # Загружаем связанные данные
    await faculty.load_relations('programs', 'teachers')
    programs = faculty.programs
    for program in programs:
        await program.load_relations('cohorts')

    return faculty


@router.put("/{faculty_id}", response_model=FacultyResponse)
async def update_faculty(faculty_id: int, faculty_update: FacultyUpdate):
    """Обновить данные факультета"""
    return await Faculty.update_node(
        faculty_id,
        faculty_update.model_dump(exclude_unset=True)
    )


@router.delete("/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faculty(faculty_id: int):
    """Удалить факультет"""
    await Faculty.delete_by_id(faculty_id)
