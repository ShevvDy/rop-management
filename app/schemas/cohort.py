from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class CohortBase(BaseModel):
    program_id: int = Field(..., description="ID программы обучения")
    cohort_year: int = Field(..., description="Год набора", ge=2000, le=2100)
    director_id: Optional[int] = Field(None, description="ID руководителя образовательной программы")
    manager_id: Optional[int] = Field(None, description="ID менеджера программы")


class CohortCreate(CohortBase):
    pass


class CohortUpdate(BaseModel):
    program_id: Optional[int] = Field(None, description="ID программы обучения")
    cohort_year: Optional[int] = Field(None, description="Год набора", ge=2000, le=2100)
    director_id: Optional[int] = Field(None, description="ID руководителя образовательной программы")
    manager_id: Optional[int] = Field(None, description="ID менеджера программы")


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

        faculty_id: int = Field(exclude=True)
        faculty: FacultyResponse = Field(..., description="Факультет ОП")

    class Specialization(SpecializationResponse):
        cohort_id: int = Field(exclude=True)

    class EducationPlan(PlannedCourseResponse):
        cohort_id: int = Field(exclude=True)

    program_id: int = Field(exclude=True)
    director_id: int = Field(exclude=True)
    manager_id: int = Field(exclude=True)
    program: Program = Field(..., description="Образовательная программа")
    director: UserResponse = Field(..., description="Руководитель ОП")
    manager: UserResponse = Field(..., description="Менеджер ОП")
    specializations: list[Specialization] = Field(..., description="Специализации программы")
    education_plan: list[EducationPlan] = Field(..., description="Учебный план")

