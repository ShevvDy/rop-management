from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar
from datetime import date


class TeacherBaseSchema(BaseModel):
    teacher_id: int = Field(..., description="ID преподавателя")
    start_date: date = Field(..., description="Дата начала работы")
    end_date: Optional[date] = Field(None, description="Дата окончания работы")

    model_config = ConfigDict(from_attributes=True)


class TeacherCreateSchema(TeacherBaseSchema):
    teacher_id: Optional[int] = Field(None, exclude=True)
    user_id: int = Field(..., description="ID пользователя")
    faculty_id: int = Field(..., description="ID факультета")


class TeacherUpdateSchema(BaseModel):
    start_date: Optional[date] = Field(None, description="Дата начала работы")
    end_date: Optional[date] = Field(None, description="Дата окончания работы")


class TeacherResponseSchema(TeacherBaseSchema):
    from .user import UserBaseSchema
    from .faculty import FacultyBaseSchema

    UserBaseSchema: ClassVar
    FacultyBaseSchema: ClassVar

    user: UserBaseSchema = Field(..., description="Пользователь")
    faculty: FacultyBaseSchema = Field(..., description="Факультет")
