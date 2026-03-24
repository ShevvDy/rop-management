from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List

from ..models import Team, get_session
from ..schemas import TeamCreate, TeamUpdate, TeamResponse, TeamWithRelations


router = APIRouter(prefix="/team", tags=["team"])


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team: TeamCreate,
    db: AsyncSession = Depends(get_session)
):
    """Создать новую команду"""
    db_team = await Team.create(db, team.model_dump())
    await db.commit()
    await db.refresh(db_team)
    return db_team


@router.get("", response_model=List[TeamResponse])
async def get_teams(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_session)
):
    """Получить список всех команд"""
    return await Team.get_list(db, skip=skip, limit=limit)


@router.get("/{team_id}", response_model=TeamWithRelations)
async def get_team(
    team_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Получить команду по ID"""
    return await Team.get_by_id(
        db, team_id, load_relations=[
            selectinload(Team.owner),
            selectinload(Team.tags),
            selectinload(Team.members),
            selectinload(Team.courses)
        ]
    )


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    team_update: TeamUpdate,
    db: AsyncSession = Depends(get_session)
):
    """Обновить данные команды"""
    team = await Team.update(
        db,
        team_id,
        team_update.model_dump(exclude_unset=True)
    )
    await db.commit()
    await db.refresh(team)
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: int,
    db: AsyncSession = Depends(get_session)
):
    """Удалить команду"""
    await Team.delete(db, team_id)
    await db.commit()

