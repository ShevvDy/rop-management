from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar

from ..models import EducationForm, EducationLevel, EducationLang


class ProgramBase(BaseModel):
    name: str = Field(..., description="Название программы обучения")
    accreditation_year: int = Field(..., description="Год аккредитации", ge=1900, le=2100)
    level: EducationLevel = Field(..., description="Уровень образования")
    form: EducationForm = Field(default=EducationForm.offline, description="Форма обучения")
    lang: EducationLang = Field(..., description="Язык обучения")
    duration_years: int = Field(..., description="Длительность обучения в годах", ge=1, le=10)
    faculty_id: int = Field(..., description="ID факультета")


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Название программы обучения")
    accreditation_year: Optional[int] = Field(None, description="Год аккредитации", ge=1900, le=2100)
    level: Optional[EducationLevel] = Field(None, description="Уровень образования")
    form: Optional[EducationForm] = Field(None, description="Форма обучения")
    lang: Optional[EducationLang] = Field(None, description="Язык обучения")
    duration_years: Optional[int] = Field(None, description="Длительность обучения в годах", ge=1, le=10)
    faculty_id: Optional[int] = Field(None, description="ID факультета")


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

    class Cohort(CohortResponse):
        program_id: int = Field(exclude=True)

    class Group(GroupResponse):
        program_id: int = Field(exclude=True)

    faculty_id: int = Field(exclude=True)
    faculty: FacultyResponse = Field(..., description="Факультет ОП")
    cohorts: list[Cohort] = Field(..., description="Потоки по году набора")
    groups: list[Group] = Field(..., description="Группы ОП")
