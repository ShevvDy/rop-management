from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class ProgramBaseSchema(BaseModel):
    program_id: int = Field(..., description="Уникальный идентификатор программы обучения")
    name: str = Field(..., description="Название программы обучения")
    accreditation_year: int = Field(..., description="Год аккредитации", ge=1900, le=2100)
    level: str = Field(..., description="Уровень образования")
    form: str = Field(default="offline", description="Форма обучения")
    lang: str = Field(default="ru", description="Язык обучения")
    duration_years: int = Field(..., description="Длительность обучения в годах", ge=1, le=10)

    model_config = ConfigDict(from_attributes=True)


class ProgramCreateSchema(ProgramBaseSchema):
    program_id: int = Field(None, exclude=True)
    faculty_id: Optional[int] = Field(..., description="ID факультета")


class ProgramUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, description="Название программы обучения")
    accreditation_year: Optional[int] = Field(None, description="Год аккредитации", ge=1900, le=2100)
    level: Optional[str] = Field(None, description="Уровень образования")
    form: Optional[str] = Field(None, description="Форма обучения")
    lang: Optional[str] = Field(None, description="Язык обучения")
    duration_years: Optional[int] = Field(None, description="Длительность обучения в годах", ge=1, le=10)


class ProgramResponseSchema(ProgramBaseSchema):
    from .faculty import FacultyBaseSchema
    FacultyBaseSchema: ClassVar

    faculty: FacultyBaseSchema = Field(..., description="Факультет программы обучения")


class ProgramWithRelationsSchema(ProgramResponseSchema):
    from .cohort import CohortBaseSchema
    CohortBaseSchema: ClassVar

    class Cohort(CohortBaseSchema):
        from .user import UserBaseSchema
        UserBaseSchema: ClassVar

        director: Optional[UserBaseSchema] = Field(None, description="Руководитель ОП набора")
        manager: Optional[UserBaseSchema] = Field(None, description="Менеджер ОП набора")

    cohorts: list[Cohort] = Field(..., description="Список наборов программы обучения")
