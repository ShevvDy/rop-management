from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class FacultyBaseSchema(BaseModel):
    faculty_id: int = Field(..., description="Уникальный идентификатор факультета")
    name: str = Field(..., description="Название факультета")
    short_name: Optional[str] = Field(..., description="Короткое название факультета")

    model_config = ConfigDict(from_attributes=True)


class FacultyCreateSchema(FacultyBaseSchema):
    faculty_id: int = Field(None, exclude=True)


class FacultyUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, description="Название факультета")
    short_name: Optional[str] = Field(None, description="Короткое название факультета")


class FacultyResponseSchema(FacultyBaseSchema):
    from .program import ProgramBaseSchema
    ProgramBaseSchema: ClassVar

    programs: list[ProgramBaseSchema] = Field(..., description="Список программ обучения на факультете")
