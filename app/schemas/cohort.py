from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class CohortBase(BaseModel):
    cohort_year: int = Field(..., description="Год набора", ge=2000, le=2100)


class CohortCreate(CohortBase):
    pass


class CohortUpdate(BaseModel):
    cohort_year: Optional[int] = Field(None, description="Год набора", ge=2000, le=2100)


class CohortResponse(CohortBase):
    cohort_id: int
    model_config = ConfigDict(from_attributes=True)


class CohortWithRelations(CohortResponse):
    from .program import ProgramResponse
    from .specialization import SpecializationResponse
    from .planned_course import PlannedCourseResponse
    from .user import UserResponse
    ProgramResponse: ClassVar
    SpecializationResponse: ClassVar
    PlannedCourseResponse: ClassVar
    UserResponse: ClassVar

    class Program(ProgramResponse):
        from .faculty import FacultyResponse
        FacultyResponse: ClassVar

        faculty: FacultyResponse = Field(..., description="Факультет ОП")

    program: Program = Field(..., description="Образовательная программа")
    director: UserResponse = Field(..., description="Руководитель ОП")
    manager: UserResponse = Field(..., description="Менеджер ОП")
    specializations: list[SpecializationResponse] = Field(..., description="Специализации программы")
    education_plan: list[PlannedCourseResponse] = Field(..., description="Учебный план")
