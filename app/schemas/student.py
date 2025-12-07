from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

from ..models import StudentStatus


class StudentBase(BaseModel):
    user_id: int = Field(..., description="ID пользователя")
    cohort_id: int = Field(..., description="ID года набора")
    group_id: Optional[int] = Field(None, description="ID группы")
    start_date: date = Field(..., description="Дата начала обучения")
    end_date: date = Field(..., description="Дата окончания обучения")
    status: Optional[StudentStatus] = Field(None, description="Статус студента")


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    user_id: Optional[int] = Field(None, description="ID пользователя")
    cohort_id: Optional[int] = Field(None, description="ID года набора")
    group_id: Optional[int] = Field(None, description="ID группы")
    start_date: Optional[date] = Field(None, description="Дата начала обучения")
    end_date: Optional[date] = Field(None, description="Дата окончания обучения")
    status: Optional[StudentStatus] = Field(None, description="Статус студента")


class StudentResponse(StudentBase):
    student_id: int

    class Config:
        from_attributes = True
