from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class TeamBase(BaseModel):
    name: str = Field(..., description="Название команды")
    owner_id: Optional[int] = Field(None, description="ID владельца команды")
    is_visible: bool = Field(..., description="Видимость команды")


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Название команды")
    owner_id: Optional[int] = Field(None, description="ID владельца команды")
    is_visible: Optional[bool] = Field(None, description="Видимость команды")


class TeamResponse(TeamBase):
    team_id: int
    model_config = ConfigDict(from_attributes=True)


class TeamWithRelations(TeamResponse):
    from .user import UserResponse
    from .tag import TagResponse
    from .course import CourseResponse
    UserResponse: ClassVar
    TagResponse: ClassVar
    CourseResponse: ClassVar

    owner: Optional[UserResponse] = Field(..., description="Владелец команды")
    tags: list[TagResponse] = Field(..., description="Список тегов")
    members: list[UserResponse] = Field(..., description="Участники команды")
    courses: list[CourseResponse] = Field(..., description="Связанные курсы")

