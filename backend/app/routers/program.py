from fastapi import APIRouter, status, Depends
from typing import List

from ..models import Program
from ..schemas import ProgramBaseSchema, ProgramCreateSchema, ProgramUpdateSchema, ProgramResponseSchema, ProgramWithRelationsSchema
from ..security import role_required, AdminRole

router = APIRouter(prefix="/program", tags=["program"])


@router.post("", response_model=ProgramResponseSchema, status_code=status.HTTP_201_CREATED, dependencies=[Depends(role_required(AdminRole))])
async def create_program(program: ProgramCreateSchema, user=Depends(role_required(AdminRole))):
    """Создать новую программу обучения"""
    return await Program.create_node(program.model_dump())


@router.get("", response_model=List[ProgramResponseSchema], dependencies=[Depends(role_required())])
async def get_programs(skip: int = 0, limit: int = 100, user=Depends(role_required())):
    """Получить список всех программ обучения"""
    return await Program.get_list(skip=skip, limit=limit, relations=['faculty'])


@router.get("/{program_id}", response_model=ProgramWithRelationsSchema, dependencies=[Depends(role_required())])
async def get_program(program_id: int, user=Depends(role_required())):
    """Получить программу обучения по ID"""
    return await Program.get_by_id(program_id, relations=['faculty', 'cohorts'])


@router.put("/{program_id}", response_model=ProgramBaseSchema, dependencies=[Depends(role_required(AdminRole))])
async def update_program(program_id: int, program_update: ProgramUpdateSchema, user=Depends(role_required(AdminRole))):
    """Обновить данные программы обучения"""
    return await Program.update_node(
        program_id,
        program_update.model_dump(exclude_unset=True)
    )


@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(role_required(AdminRole))])
async def delete_program(program_id: int, user=Depends(role_required(AdminRole))):
    """Удалить программу обучения"""
    await Program.delete_by_id(program_id)
