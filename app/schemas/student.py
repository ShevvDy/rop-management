from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar
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
    model_config = ConfigDict(from_attributes=True)


class StudentWithRelations(StudentResponse):
    from .user import UserResponse
    from .cohort import CohortResponse
    from .group import GroupResponse
    from .stream import StreamResponse
    UserResponse: ClassVar
    CohortResponse: ClassVar
    GroupResponse: ClassVar
    StreamResponse: ClassVar

    user: UserResponse = Field(..., description="Данные пользователя")
    cohort: CohortResponse = Field(..., description="Набор")
    group: Optional[GroupResponse] = Field(None, description="Группа")
    streams: list[StreamResponse] = Field(default=[], description="Список потоков студента")
