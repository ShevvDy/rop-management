from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class SemesterBase(BaseModel):
    semester_number: int = Field(..., description="Номер семестра", ge=1, le=12)
    study_year: str = Field(..., description="Учебный год в формате YYYY-YYYY", pattern=r"^\d{4}-\d{4}$")


class SemesterCreate(SemesterBase):
    pass


class SemesterUpdate(BaseModel):
    semester_number: Optional[int] = Field(None, description="Номер семестра", ge=1, le=12)
    study_year: Optional[str] = Field(None, description="Учебный год в формате YYYY-YYYY", pattern=r"^\d{4}-\d{4}$")


class SemesterResponse(SemesterBase):
    semester_id: int
    model_config = ConfigDict(from_attributes=True)
