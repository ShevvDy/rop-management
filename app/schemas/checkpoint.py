from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar
from datetime import date


class CheckpointBase(BaseModel):
    stream_id: int = Field(..., description="ID потока")
    checkpoint_date: Optional[date] = Field(None, description="Дата чекпоинта")
    materials: list[str] = Field(default=[], description="Материалы")
    notes: Optional[str] = Field(None, description="Заметки")


class CheckpointCreate(CheckpointBase):
    pass


class CheckpointUpdate(BaseModel):
    stream_id: Optional[int] = Field(None, description="ID потока")
    checkpoint_date: Optional[date] = Field(None, description="Дата чекпоинта")
    materials: Optional[list[str]] = Field(None, description="Материалы")
    notes: Optional[str] = Field(None, description="Заметки")


class CheckpointResponse(CheckpointBase):
    checkpoint_id: int
    model_config = ConfigDict(from_attributes=True)


class CheckpointWithRelations(CheckpointResponse):
    from .stream import StreamResponse
    from .tag import TagResponse
    StreamResponse: ClassVar
    TagResponse: ClassVar

    stream: StreamResponse = Field(..., description="Поток")
    tags: list[TagResponse] = Field(default=[], description="Список тегов")

