from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

from ..models import EducationForm


class StreamBase(BaseModel):
    semester_id: int = Field(..., description="ID семестра")
    course_id: int = Field(..., description="ID курса")
    teacher_id: Optional[int] = Field(None, description="ID преподавателя")
    form: EducationForm = Field(default=EducationForm.offline, description="Форма обучения")
    name: str = Field(..., description="Название потока", max_length=15)
    start_date: date = Field(..., description="Дата начала")
    exam_date: Optional[date] = Field(None, description="Дата экзамена")


class StreamCreate(StreamBase):
    pass


class StreamUpdate(BaseModel):
    semester_id: Optional[int] = Field(None, description="ID семестра")
    course_id: Optional[int] = Field(None, description="ID курса")
    teacher_id: Optional[int] = Field(None, description="ID преподавателя")
    form: Optional[EducationForm] = Field(None, description="Форма обучения")
    name: Optional[str] = Field(None, description="Название потока", max_length=15)
    start_date: Optional[date] = Field(None, description="Дата начала")
    exam_date: Optional[date] = Field(None, description="Дата экзамена")


class StreamResponse(StreamBase):
    stream_id: int

    class Config:
        from_attributes = True
