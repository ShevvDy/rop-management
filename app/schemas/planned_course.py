from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, ClassVar


class PlannedCourseBaseSchema(BaseModel):
    planned_course_id: int = Field(..., description="ID планируемого курса")

    model_config = ConfigDict(from_attributes=True)


class PlannedCourseCreateSchema(PlannedCourseBaseSchema):
    planned_course_id: Optional[int] = Field(None, exclude=True)
    cohort_id: int = Field(..., description="ID набора, для которого планируется курс")
    course_id: int = Field(..., description="ID курса, который планируется")
    semester_id: int = Field(..., description="ID семестра, в котором планируется курс")
    specialization_id: Optional[int] = Field(None, description="ID специализации (если планируется для специализации)")


class PlannedCourseUpdateSchema(BaseModel):
    semester_id: Optional[int] = Field(None, description="ID семестра, в котором планируется курс")
    specialization_id: Optional[int] = Field(None, description="ID специализации (если планируется для специализации)")


class PlannedCourseResponseSchema(PlannedCourseBaseSchema):
    from .cohort import CohortBaseSchema
    from .course import CourseBaseSchema
    from .semester import SemesterBaseSchema
    from .specialization import SpecializationBaseSchema

    CohortBaseSchema: ClassVar
    CourseBaseSchema: ClassVar
    SemesterBaseSchema: ClassVar
    SpecializationBaseSchema: ClassVar

    cohort: CohortBaseSchema = Field(..., description="Набор, для которого планируется курс")
    course: CourseBaseSchema = Field(..., description="Курс, который планируется")
    semester: SemesterBaseSchema = Field(..., description="Семестр, в котором планируется курс")
    specialization: Optional[SpecializationBaseSchema] = Field(None, description="Специализация, для которой планируется курс (если есть)")
