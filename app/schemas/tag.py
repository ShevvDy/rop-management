from pydantic import BaseModel, Field
from typing import Optional


class TagBase(BaseModel):
    name: str = Field(..., description="Название тега")


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Название тега")


class TagResponse(TagBase):
    tag_id: int

    class Config:
        from_attributes = True
