from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar
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
    model_config = ConfigDict(from_attributes=True)


class StreamWithRelations(StreamResponse):
    from .checkpoint import CheckpointResponse
    from .semester import SemesterResponse
    from .course import CourseResponse
    from .teacher import TeacherResponse
    from .student import StudentResponse
    CheckpointResponse: ClassVar
    SemesterResponse: ClassVar
    CourseResponse: ClassVar
    TeacherResponse: ClassVar
    StudentResponse: ClassVar

    checkpoints: list[CheckpointResponse] = Field(..., description="Список контрольных точек")
    semester: SemesterResponse = Field(..., description="Семестр")
    course: CourseResponse = Field(..., description="Курс")
    teacher: Optional[TeacherResponse] = Field(None, description="Преподаватель")
    students: list[StudentResponse] = Field(default=[], description="Список студентов потока")
