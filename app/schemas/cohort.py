from pydantic import BaseModel, Field
from typing import Optional


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

    class Config:
        from_attributes = True
