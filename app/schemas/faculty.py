from pydantic import BaseModel, Field
from typing import Optional


class FacultyBase(BaseModel):
    name: str = Field(..., description="Название факультета")


class FacultyCreate(FacultyBase):
    pass


class FacultyUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Название факультета")


class FacultyResponse(FacultyBase):
    faculty_id: int

    class Config:
        from_attributes = True
