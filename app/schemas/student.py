from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar
from datetime import date


class StudentBaseSchema(BaseModel):
    student_id: int = Field(..., description="ID студента")
    start_date: date = Field(..., description="Дата начала обучения")
    end_date: date = Field(..., description="Дата окончания обучения")
    status: Optional[str] = Field(None, description="Статус студента")

    model_config = ConfigDict(from_attributes=True)


class StudentCreateSchema(StudentBaseSchema):
    student_id: Optional[int] = Field(None, exclude=True)
    user_id: int = Field(..., description="ID пользователя")
    cohort_id: int = Field(..., description="ID года набора")


class StudentUpdateSchema(BaseModel):
    start_date: Optional[date] = Field(None, description="Дата начала обучения")
    end_date: Optional[date] = Field(None, description="Дата окончания обучения")
    status: Optional[str] = Field(None, description="Статус студента")


class StudentResponseSchema(StudentBaseSchema):
    from .user import UserBaseSchema
    from .cohort import CohortBaseSchema
    from .group import GroupBaseSchema

    UserBaseSchema: ClassVar
    CohortBaseSchema: ClassVar
    GroupBaseSchema: ClassVar

    class Cohort(CohortBaseSchema):
        from .program import ProgramBaseSchema
        ProgramBaseSchema: ClassVar
        program: ProgramBaseSchema = Field(..., description="Программа обучения набора")

    class Group(GroupBaseSchema):
        from .specialization import SpecializationBaseSchema
        SpecializationBaseSchema: ClassVar
        specialization: Optional[SpecializationBaseSchema] = Field(None, description="Специализация группы")

    user: UserBaseSchema = Field(..., description="Пользователь")
    cohort: Cohort = Field(..., description="Год набора")
    group: Optional[Group] = Field(None, description="Группа студента")
