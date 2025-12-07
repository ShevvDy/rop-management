from pydantic import BaseModel, Field
from typing import Optional


class GroupBase(BaseModel):
    name: str = Field(..., description="Название группы", max_length=10)
    program_id: int = Field(..., description="ID программы обучения")
    specialization_id: Optional[int] = Field(None, description="ID специализации")


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Название группы", max_length=10)
    program_id: Optional[int] = Field(None, description="ID программы обучения")
    specialization_id: Optional[int] = Field(None, description="ID специализации")


class GroupResponse(GroupBase):
    group_id: int

    class Config:
        from_attributes = True
