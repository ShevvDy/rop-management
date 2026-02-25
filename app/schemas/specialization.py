from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class SpecializationBase(BaseModel):
    name: str = Field(..., description="Название специализации")


class SpecializationCreate(SpecializationBase):
    pass


class SpecializationUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Название специализации")


class SpecializationResponse(SpecializationBase):
    specialization_id: int
    model_config = ConfigDict(from_attributes=True)


class SpecializationWithRelations(SpecializationResponse):
    from .cohort import CohortResponse
    from .planned_course import PlannedCourseResponse
    from .group import GroupResponse
    CohortResponse: ClassVar
    PlannedCourseResponse: ClassVar
    GroupResponse: ClassVar

    cohort: CohortResponse = Field(..., description="Набор")
    education_plan: list[PlannedCourseResponse] = Field(default=[], description="Учебный план специализации")
    groups: list[GroupResponse] = Field(default=[], description="Группы специализации")
