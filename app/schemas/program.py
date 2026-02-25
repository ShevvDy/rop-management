from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class ProgramBase(BaseModel):
    name: str = Field(..., description="Название программы обучения")
    accreditation_year: int = Field(..., description="Год аккредитации", ge=1900, le=2100)
    level: str = Field(..., description="Уровень образования")
    form: str = Field(default="offline", description="Форма обучения")
    lang: str = Field(default="ru", description="Язык обучения")
    duration_years: int = Field(..., description="Длительность обучения в годах", ge=1, le=10)
    faculty_id: int = Field(..., description="ID факультета")


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Название программы обучения")
    accreditation_year: Optional[int] = Field(None, description="Год аккредитации", ge=1900, le=2100)
    level: Optional[str] = Field(None, description="Уровень образования")
    form: Optional[str] = Field(None, description="Форма обучения")
    lang: Optional[str] = Field(None, description="Язык обучения")
    duration_years: Optional[int] = Field(None, description="Длительность обучения в годах", ge=1, le=10)


class ProgramResponse(ProgramBase):
    program_id: int
    model_config = ConfigDict(from_attributes=True)


class ProgramWithRelations(ProgramResponse):
    from .cohort import CohortResponse
    from .faculty import FacultyResponse
    from .group import GroupResponse
    CohortResponse: ClassVar
    FacultyResponse: ClassVar
    GroupResponse: ClassVar

    faculty: FacultyResponse = Field(..., description="Факультет ОП")
    cohorts: list[CohortResponse] = Field(..., description="Потоки по году набора")
    groups: list[GroupResponse] = Field(..., description="Группы ОП")
