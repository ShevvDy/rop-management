from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar
from datetime import date


class TeacherBase(BaseModel):
    start_date: date = Field(..., description="Дата начала работы")
    end_date: Optional[date] = Field(None, description="Дата окончания работы")
    position: str = Field(..., description="Должность преподавателя")


class TeacherCreate(TeacherBase):
    pass


class TeacherUpdate(BaseModel):
    start_date: Optional[date] = Field(None, description="Дата начала работы")
    end_date: Optional[date] = Field(None, description="Дата окончания работы")
    position: Optional[str] = Field(None, description="Должность преподавателя")


class TeacherResponse(TeacherBase):
    teacher_id: int
    model_config = ConfigDict(from_attributes=True)


class TeacherWithRelations(TeacherResponse):
    from .user import UserResponse
    from .faculty import FacultyResponse
    UserResponse: ClassVar
    FacultyResponse: ClassVar

    user: UserResponse = Field(..., description="Данные пользователя")
    faculty: FacultyResponse = Field(..., description="Факультет")
