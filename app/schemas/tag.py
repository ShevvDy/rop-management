from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class TagBase(BaseModel):
    name: str = Field(..., description="Название тега")


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Название тега")


class TagResponse(TagBase):
    tag_id: int
    model_config = ConfigDict(from_attributes=True)
