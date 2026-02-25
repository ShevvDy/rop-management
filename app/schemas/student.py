from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar
from datetime import date


class StudentBase(BaseModel):
    start_date: date = Field(..., description="Дата начала обучения")
    end_date: date = Field(..., description="Дата окончания обучения")
    status: Optional[str] = Field(None, description="Статус студента")


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    start_date: Optional[date] = Field(None, description="Дата начала обучения")
    end_date: Optional[date] = Field(None, description="Дата окончания обучения")
    status: Optional[str] = Field(None, description="Статус студента")


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
