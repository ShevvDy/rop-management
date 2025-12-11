from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Program, get_session
from ..schemas import ProgramCreate, ProgramUpdate, ProgramResponse


router = APIRouter(prefix="/program", tags=["program"])


@router.post("", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
async def create_program(
    program: ProgramCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать новую программу обучения"""
    db_program = await Program.create(db, program.model_dump())
    await db.commit()
    await db.refresh(db_program)
    return db_program


@router.get("", response_model=list[ProgramResponse])
async def get_programs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех программ обучения"""
    return await Program.get_list(db, skip=skip, limit=limit)


@router.get("/{program_id}", response_model=ProgramResponse)
async def get_program(
    program_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить программу обучения по ID"""
    return await Program.get_by_id(db, program_id)


@router.put("/{program_id}", response_model=ProgramResponse)
async def update_program(
    program_id: int,
    program_update: ProgramUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные программы обучения"""
    program = await Program.update(
        db,
        program_id,
        program_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(program)
    return program


@router.delete("/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_program(
    program_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить программу обучения"""
    await Program.delete(db, program_id)
    await db.commit()

