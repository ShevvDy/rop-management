from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class TagBaseSchema(BaseModel):
    tag_id: int = Field(..., description="ID тега")
    name: str = Field(..., description="Название тега")

    model_config = ConfigDict(from_attributes=True)


class TagCreateSchema(TagBaseSchema):
    tag_id: int = Field(None, exclude=True)


class TagUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, description="Название тега")
