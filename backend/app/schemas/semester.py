from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class SemesterBaseSchema(BaseModel):
    semester_id: int = Field(..., description="Уникальный идентификатор семестра")
    semester_number: int = Field(..., description="Номер семестра", ge=1, le=12)
    study_year: str = Field(..., description="Учебный год в формате YYYY-YYYY", pattern=r"^\d{4}-\d{4}$")

    model_config = ConfigDict(from_attributes=True)


class SemesterCreateSchema(SemesterBaseSchema):
    semester_id: Optional[int] = Field(None, exclude=True)


class SemesterUpdateSchema(BaseModel):
    semester_number: Optional[int] = Field(None, description="Номер семестра", ge=1, le=12)
    study_year: Optional[str] = Field(None, description="Учебный год в формате YYYY-YYYY", pattern=r"^\d{4}-\d{4}$")
