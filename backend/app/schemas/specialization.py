from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class SpecializationBaseSchema(BaseModel):
    specialization_id: int = Field(..., description="ID специализации")
    name: str = Field(..., description="Название специализации")

    model_config = ConfigDict(from_attributes=True)


class SpecializationCreateSchema(SpecializationBaseSchema):
    specialization_id: Optional[int] = Field(None, exclude=True)
    cohort_id: int = Field(..., description="ID набора, к которому принадлежит специализация")


class SpecializationUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, description="Название специализации")
    cohort_id: Optional[int] = Field(None, description="ID набора, к которому принадлежит специализация")


class SpecializationResponseSchema(SpecializationBaseSchema):
    from .cohort import CohortBaseSchema
    CohortBaseSchema: ClassVar

    class Cohort(CohortBaseSchema):
        from .program import ProgramBaseSchema
        from .user import UserBaseSchema
        ProgramBaseSchema: ClassVar
        UserBaseSchema: ClassVar

        program: ProgramBaseSchema = Field(..., description="Программа обучения набора")
        director: Optional[UserBaseSchema] = Field(None, description="Руководитель ОП набора")
        manager: Optional[UserBaseSchema] = Field(None, description="Менеджер ОП набора")

    cohort: Optional[Cohort] = Field(None, description="Год набора специализации")


class SpecializationWithRelationsSchema(SpecializationResponseSchema):
    from .group import GroupBaseSchema

    GroupBaseSchema: ClassVar

    class Group(GroupBaseSchema):
        from .cohort import CohortBaseSchema
        CohortBaseSchema: ClassVar

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

    groups: list[Group] = Field(default=[], description="Группы специализации")
