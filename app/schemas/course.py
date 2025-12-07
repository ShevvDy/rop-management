from pydantic import BaseModel, Field
from typing import Optional

from ..models import EducationForm


class CourseBase(BaseModel):
    name: str = Field(..., description="Название курса")
    code: str = Field(..., description="Код курса")
    credits: int = Field(..., description="Зачетные единицы", ge=1, le=20)
    form: EducationForm = Field(default=EducationForm.offline, description="Форма обучения")
    is_elective: bool = Field(default=False, description="Элективный курс")
    syllabus_link: Optional[str] = Field(None, description="Ссылка на силлабус")
    rpd_link: Optional[str] = Field(None, description="Ссылка на РПД")


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Название курса")
    code: Optional[str] = Field(None, description="Код курса")
    credits: Optional[int] = Field(None, description="Количество кредитов", ge=1, le=20)
    form: Optional[EducationForm] = Field(None, description="Форма обучения")
    is_elective: Optional[bool] = Field(None, description="Элективный курс")
    syllabus_link: Optional[str] = Field(None, description="Ссылка на силлабус")
    rpd_link: Optional[str] = Field(None, description="Ссылка на РПД")


class CourseResponse(CourseBase):
    course_id: int

    class Config:
        from_attributes = True
