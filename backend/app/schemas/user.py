from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, ClassVar


class UserBaseSchema(BaseModel):
    user_id: int = Field(..., description="ID пользователя")
    name: str = Field(..., description="Имя пользователя")
    surname: str = Field(..., description="Фамилия пользователя")
    patronymic: Optional[str] = Field(None, description="Отчество пользователя")
    email: Optional[EmailStr] = Field(None, description="Email пользователя")
    phone: Optional[str] = Field(None, description="Телефон пользователя")
    isu_id: Optional[int] = Field(None, description="ID пользователя в ИСУ")
    avatar: Optional[str] = Field(None, description="URL аватара пользователя")

    model_config = ConfigDict(from_attributes=True)


class UserCreateSchema(UserBaseSchema):
    user_id: Optional[int] = Field(None, exclude=True)
    tags_ids: list[int] = Field([], description="Теги пользователя")


class UserUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, description="Имя пользователя")
    surname: Optional[str] = Field(None, description="Фамилия пользователя")
    patronymic: Optional[str] = Field(None, description="Отчество пользователя")
    email: Optional[EmailStr] = Field(None, description="Email пользователя")
    phone: Optional[str] = Field(None, description="Телефон пользователя")
    isu_id: Optional[int] = Field(None, description="ID пользователя в ИСУ")
    avatar: Optional[str] = Field(None, description="URL аватара пользователя")
    tags_ids: list[int] = Field([], description="Теги пользователя")


class UserResponseSchema(UserBaseSchema):
    from .tag import TagBaseSchema
    TagBaseSchema: ClassVar
    tags: list[TagBaseSchema] = Field([], description="Теги пользователя")


class UserWithRelationsSchema(UserResponseSchema):
    from .student import StudentBaseSchema
    from .teacher import TeacherBaseSchema
    from .cohort import CohortBaseSchema
    StudentBaseSchema: ClassVar
    TeacherBaseSchema: ClassVar
    CohortBaseSchema: ClassVar

    class Cohort(CohortBaseSchema):
        from .program import ProgramBaseSchema
        ProgramBaseSchema: ClassVar
        program: ProgramBaseSchema = Field(..., description="Программа обучения набора")

    class Student(StudentBaseSchema):
        from .cohort import CohortBaseSchema
        from .group import GroupBaseSchema

        CohortBaseSchema: ClassVar
        GroupBaseSchema: ClassVar

        class Cohort(CohortBaseSchema):
            from .program import ProgramBaseSchema
            ProgramBaseSchema: ClassVar
            program: ProgramBaseSchema = Field(..., description="Программа обучения набора")

        cohort: Cohort = Field(..., description="Год набора")
        group: Optional[GroupBaseSchema] = Field(None, description="Группа студента")

    student_data: list[Student] = Field(default=[], description="Данные студента")
    teacher_data: list[TeacherBaseSchema] = Field(default=[], description="Данные преподавателя")
    directed_cohorts: list[Cohort] = Field(default=[], description="Наборы, которыми руководит")
    managed_cohorts: list[Cohort] = Field(default=[], description="Наборы, которые менеджерит")
