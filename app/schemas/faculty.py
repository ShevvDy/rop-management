from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class FacultyBase(BaseModel):
    name: str = Field(..., description="Название факультета")
    short_name: Optional[str] = Field(..., description="Короткое название факультета")


class FacultyCreate(FacultyBase):
    pass


class FacultyUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Название факультета")
    short_name: Optional[str] = Field(None, description="Короткое название факультета")


class FacultyResponse(FacultyBase):
    faculty_id: int
    model_config = ConfigDict(from_attributes=True)


class FacultyWithRelations(FacultyResponse):
    from .program import ProgramResponse
    from .teacher import TeacherResponse
    ProgramResponse: ClassVar
    TeacherResponse: ClassVar

    class Program(ProgramResponse):
        from .cohort import CohortResponse
        CohortResponse: ClassVar

        class Cohort(CohortResponse):
            director_id: int = Field(exclude=True)
            manager_id: int = Field(exclude=True)

        faculty_id: int = Field(exclude=True)
        cohorts: list[Cohort] = Field(..., description="Список наборов по году")

    programs: list[Program] = Field(..., description="Список образовательных программ факультета")
    teachers: list[TeacherResponse] = Field(default=[], description="Список преподавателей факультета")
