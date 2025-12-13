from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, ClassVar


class UserBase(BaseModel):
    name: str = Field(..., description="Имя пользователя")
    surname: str = Field(..., description="Фамилия пользователя")
    patronymic: Optional[str] = Field(None, description="Отчество пользователя")
    email: Optional[EmailStr] = Field(None, description="Email пользователя")
    phone: Optional[str] = Field(None, description="Телефон пользователя")
    isu_id: Optional[int] = Field(None, description="ID пользователя в ИСУ")
    avatar: Optional[str] = Field(None, description="URL аватара пользователя")


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Имя пользователя")
    surname: Optional[str] = Field(None, description="Фамилия пользователя")
    patronymic: Optional[str] = Field(None, description="Отчество пользователя")
    email: Optional[EmailStr] = Field(None, description="Email пользователя")
    phone: Optional[str] = Field(None, description="Телефон пользователя")
    isu_id: Optional[int] = Field(None, description="ID пользователя в ИСУ")
    avatar: Optional[str] = Field(None, description="URL аватара пользователя")


class UserResponse(UserBase):
    user_id: int
    model_config = ConfigDict(from_attributes=True)


class UserWithRelations(UserResponse):
    from .student import StudentResponse
    from .teacher import TeacherResponse
    from .cohort import CohortResponse
    from .tag import TagResponse
    from .team import TeamResponse
    from .stream import StreamResponse
    StudentResponse: ClassVar
    TeacherResponse: ClassVar
    CohortResponse: ClassVar
    TagResponse: ClassVar
    TeamResponse: ClassVar
    StreamResponse: ClassVar

    student_data: list[StudentResponse] = Field(default=[], description="Данные студента")
    teacher_data: list[TeacherResponse] = Field(default=[], description="Данные преподавателя")
    directed_cohorts: list[CohortResponse] = Field(default=[], description="Наборы, которыми руководит")
    managed_cohorts: list[CohortResponse] = Field(default=[], description="Наборы, которые менеджерит")
    tags: list[TagResponse] = Field(default=[], description="Теги пользователя")
    teacher_streams: list[StreamResponse] = Field(default=[], description="Потоки, которые ведёт как преподаватель")
    owned_teams: list[TeamResponse] = Field(default=[], description="Команды, которыми владеет")
    teams: list[TeamResponse] = Field(default=[], description="Команды, в которых состоит")
