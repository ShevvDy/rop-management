from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar
from datetime import date

from ..models.enums import TeacherPosition


class TeacherBase(BaseModel):
    user_id: int = Field(..., description="ID пользователя")
    faculty_id: int = Field(..., description="ID факультета")
    start_date: date = Field(..., description="Дата начала работы")
    end_date: Optional[date] = Field(None, description="Дата окончания работы")
    position: TeacherPosition = Field(..., description="Должность преподавателя")


class TeacherCreate(TeacherBase):
    pass


class TeacherUpdate(BaseModel):
    user_id: Optional[int] = Field(None, description="ID пользователя")
    faculty_id: Optional[int] = Field(None, description="ID факультета")
    start_date: Optional[date] = Field(None, description="Дата начала работы")
    end_date: Optional[date] = Field(None, description="Дата окончания работы")
    position: Optional[TeacherPosition] = Field(None, description="Должность преподавателя")


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
