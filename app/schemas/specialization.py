from pydantic import BaseModel, Field
from typing import Optional


class SpecializationBase(BaseModel):
    cohort_id: int = Field(..., description="ID года набора")
    name: str = Field(..., description="Название специализации")


class SpecializationCreate(SpecializationBase):
    pass


class SpecializationUpdate(BaseModel):
    cohort_id: Optional[int] = Field(None, description="ID года набора")
    name: Optional[str] = Field(None, description="Название специализации")


class SpecializationResponse(SpecializationBase):
    specialization_id: int

    class Config:
        from_attributes = True
