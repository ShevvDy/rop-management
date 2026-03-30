from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class GroupBaseSchema(BaseModel):
    group_id: int = Field(..., description="ID группы", ge=1)
    name: str = Field(..., description="Название группы", max_length=10)

    model_config = ConfigDict(from_attributes=True)


class GroupCreateSchema(GroupBaseSchema):
    group_id: Optional[int] = Field(None, exclude=True)
    cohort_id: int = Field(..., description="ID набора, к которому принадлежит группа")
    specialization_id: Optional[int] = Field(None, description="ID специализации (если есть)")


class GroupUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, description="Название группы", max_length=10)
    specialization_id: Optional[int] = Field(None, description="ID специализации (если есть)")


class GroupResponseSchema(GroupBaseSchema):
    from .cohort import CohortBaseSchema
    from .specialization import SpecializationBaseSchema
    CohortBaseSchema: ClassVar
    SpecializationBaseSchema: ClassVar

    class Cohort(CohortBaseSchema):
        from .program import ProgramBaseSchema
        from .user import UserBaseSchema
        ProgramBaseSchema: ClassVar
        UserBaseSchema: ClassVar

        program: ProgramBaseSchema = Field(..., description="Программа обучения набора")
        director: Optional[UserBaseSchema] = Field(None, description="Руководитель ОП набора")
        manager: Optional[UserBaseSchema] = Field(None, description="Менеджер ОП набора")

    cohort: Cohort = Field(..., description="Набор группы")
    specialization: Optional[SpecializationBaseSchema] = Field(None, description="Специализация группы")


class GroupWithRelationsSchema(GroupResponseSchema):
    from .student import StudentBaseSchema
    StudentBaseSchema: ClassVar

    class Student(StudentBaseSchema):
        from .user import UserBaseSchema
        UserBaseSchema: ClassVar

        user: UserBaseSchema = Field(..., description="Пользователь")

    students: list[Student] = Field(..., description="Список студентов группы")
