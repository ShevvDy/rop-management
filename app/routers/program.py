from fastapi import APIRouter, status
from typing import List

from ..models import Program
from ..schemas import ProgramCreate, ProgramUpdate, ProgramResponse

router = APIRouter(prefix="/program", tags=["program"])


@router.post("", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
async def create_program(program: ProgramCreate):
    """Создать новую программу обучения"""
    return await Program.create_node(program.model_dump())


@router.get("", response_model=List[ProgramResponse])
async def get_programs(skip: int = 0, limit: int = 100):
    """Получить список всех программ обучения"""
    return await Program.get_list(skip=skip, limit=limit)


@router.get("/{program_id}", response_model=ProgramResponse)
async def get_program(program_id: int):
    """Получить программу обучения по ID"""
    return await Program.get_by_id(program_id)


@router.put("/{program_id}", response_model=ProgramResponse)
async def update_program(program_id: int, program_update: ProgramUpdate):
    """Обновить данные программы обучения"""
    return await Program.update_node(
        program_id,
        program_update.model_dump(exclude_unset=True)
    )


@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_program(program_id: int):
    """Удалить программу обучения"""
    await Program.delete_by_id(program_id)
