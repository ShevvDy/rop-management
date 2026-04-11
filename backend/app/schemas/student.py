from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar
from datetime import date


class StudentBaseSchema(BaseModel):
    student_id: int = Field(..., description="ID студента")
    start_date: date = Field(..., description="Дата начала обучения")
    end_date: date = Field(..., description="Дата окончания обучения")
    status: Optional[str] = Field(None, description="Статус студента")

    model_config = ConfigDict(from_attributes=True)


class StudentCreateSchema(StudentBaseSchema):
    student_id: Optional[int] = Field(None, exclude=True)
    user_id: int = Field(..., description="ID пользователя")
    cohort_id: int = Field(..., description="ID года набора")
    specialization_id: Optional[int] = Field(None, description="ID специализации")


class StudentUpdateSchema(BaseModel):
    start_date: Optional[date] = Field(None, description="Дата начала обучения")
    end_date: Optional[date] = Field(None, description="Дата окончания обучения")
    status: Optional[str] = Field(None, description="Статус студента")


class StudentResponseSchema(StudentBaseSchema):
    from .user import UserBaseSchema
    from .cohort import CohortBaseSchema
    from .specialization import SpecializationBaseSchema

    UserBaseSchema: ClassVar
    CohortBaseSchema: ClassVar
    SpecializationBaseSchema: ClassVar

    class Cohort(CohortBaseSchema):
        from .program import ProgramBaseSchema
        ProgramBaseSchema: ClassVar
        program: ProgramBaseSchema = Field(..., description="Программа обучения набора")

    user: UserBaseSchema = Field(..., description="Пользователь")
    cohort: Cohort = Field(..., description="Год набора")
    specialization: Optional[SpecializationBaseSchema] = Field(None, description="Специализация группы")
