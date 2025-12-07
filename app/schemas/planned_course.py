from pydantic import BaseModel, ConfigDict
from typing import Optional


class PlannedCourseBase(BaseModel):
    cohort_id: int
    specialization_id: Optional[int] = None
    course_id: int
    semester_id: int


class PlannedCourseCreate(PlannedCourseBase):
    pass


class PlannedCourseUpdate(BaseModel):
    cohort_id: Optional[int] = None
    specialization_id: Optional[int] = None
    course_id: Optional[int] = None
    semester_id: Optional[int] = None


class PlannedCourseResponse(PlannedCourseBase):
    planned_course_id: int

    model_config = ConfigDict(from_attributes=True)
