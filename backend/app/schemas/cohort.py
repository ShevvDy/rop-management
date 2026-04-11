from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class CohortBaseSchema(BaseModel):
    cohort_id: int = Field(..., description="Уникальный идентификатор набора")
    cohort_year: int = Field(..., description="Год набора", ge=2000, le=2100)

    model_config = ConfigDict(from_attributes=True)


class CohortCreateSchema(CohortBaseSchema):
    cohort_id: Optional[int] = Field(None, exclude=True)
    program_id: int = Field(..., description="ID программы обучения")
    director_id: Optional[int] = Field(None, description="ID руководителя ОП")
    manager_id: Optional[int] = Field(None, description="ID менеджера ОП")


class CohortUpdateSchema(BaseModel):
    cohort_year: Optional[int] = Field(None, description="Год набора", ge=2000, le=2100)
    director_id: Optional[int] = Field(None, description="ID руководителя ОП")
    manager_id: Optional[int] = Field(None, description="ID менеджера ОП")


class CohortResponseSchema(CohortBaseSchema):
    from .program import ProgramBaseSchema
    from .user import UserBaseSchema
    ProgramBaseSchema: ClassVar
    UserBaseSchema: ClassVar

    program: ProgramBaseSchema = Field(..., description="Программа обучения набора")
    director: Optional[UserBaseSchema] = Field(None, description="Руководитель ОП набора")
    manager: Optional[UserBaseSchema] = Field(None, description="Менеджер ОП набора")


class CohortWithRelationsSchema(CohortResponseSchema):
    from .program import ProgramResponseSchema
    from .specialization import SpecializationBaseSchema
    ProgramResponseSchema: ClassVar
    SpecializationBaseSchema: ClassVar

    program: ProgramResponseSchema = Field(..., description="Программа обучения набора")
    specializations: list[SpecializationBaseSchema] = Field(..., description="Список специализаций набора")


class EducationPlanUpdateSchema(BaseModel):
    from .course import CourseBaseSchema
    CourseBaseSchema: ClassVar

    class Node(CourseBaseSchema):
        course_id: Optional[int] = Field(None, description="ID курса")

    class Edge(BaseModel):
        source: int | str = Field(..., description="ID или код исходного курса")
        target: int | str = Field(..., description="ID или код целевого курса")

    nodes: list[Node] = Field(..., description="Список курсов учебного плана")
    edges: list[Edge] = Field(..., description="Список рёбер между курсами учебного плана")


class EducationPlanSchema(EducationPlanUpdateSchema):
    from .course import CourseBaseSchema
    CourseBaseSchema: ClassVar

    class Node(CourseBaseSchema):
        elective_students_ids: list[int] = Field([], description="Студенты, записанные на курс")

    nodes: list[Node] = Field(..., description="Список курсов учебного плана")


class CohortStudentsResponseSchema(BaseModel):
    from .student import StudentBaseSchema
    from .specialization import SpecializationBaseSchema
    StudentBaseSchema: ClassVar
    SpecializationBaseSchema: ClassVar

    class Student(StudentBaseSchema):
        from .user import UserBaseSchema
        UserBaseSchema: ClassVar
        user: UserBaseSchema = Field(..., description="Пользователь")
        specialization_id: Optional[int] = Field(None, description="Специазиация студента")

    students: list[Student] = Field(..., description="Студенты года набора")
    specializations: list[SpecializationBaseSchema] = Field(..., description="Специализации года набора")


class CohortStudentUpdateSchema(BaseModel):
    student_id: int = Field(..., description="ID студента")
    specialization_id: Optional[int] = Field(..., description="ID специализации")
