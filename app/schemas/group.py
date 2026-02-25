from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class GroupBase(BaseModel):
    name: str = Field(..., description="Название группы", max_length=10)


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Название группы", max_length=10)


class GroupResponse(GroupBase):
    group_id: int
    model_config = ConfigDict(from_attributes=True)


class GroupWithRelations(GroupResponse):
    from .program import ProgramResponse
    from .specialization import SpecializationResponse
    from .student import StudentResponse
    ProgramResponse: ClassVar
    SpecializationResponse: ClassVar
    StudentResponse: ClassVar

    program: ProgramResponse = Field(..., description="Программа обучения")
    specialization: Optional[SpecializationResponse] = Field(None, description="Специализация")
    students: list[StudentResponse] = Field(default=[], description="Список студентов группы")
