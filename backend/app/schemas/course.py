from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, ClassVar


class CourseBaseSchema(BaseModel):
    course_id: int = Field(..., description="Уникальный идентификатор курса")
    name: str = Field(..., description="Название курса")
    code: str = Field(..., description="Код курса")
    semester_number: int = Field(..., description="Номер семестра", ge=1, le=12)
    credits: int = Field(..., description="Зачетные единицы", ge=1, le=20)
    form: str = Field(default="offline", description="Форма обучения")
    is_elective: bool = Field(default=False, description="Элективный курс")
    syllabus_link: Optional[str] = Field(None, description="Ссылка на силлабус")
    rpd_link: Optional[str] = Field(None, description="Ссылка на РПД")
    is_last: Optional[bool] = Field(False, description="Является ли курс заключающим в учебном плане")

    model_config = ConfigDict(from_attributes=True)


class CourseCreateSchema(CourseBaseSchema):
    course_id: Optional[int] = Field(None, exclude=True)
    cohort_id: int = Field(..., description="ID потока по учебному году")
    specialization_id: Optional[int] = Field(None, description="ID специализации")
    prerequisites_ids: Optional[list[int]] = Field(default=None, description="Список ID курсов-пререквизитов")
    tags_ids: Optional[list[int]] = Field(default=None, description="Список ID тегов курса")


class CourseUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, description="Название курса")
    code: Optional[str] = Field(None, description="Код курса")
    semester_number: Optional[int] = Field(None, description="Номер семестра", ge=1, le=12)
    credits: Optional[int] = Field(None, description="Количество кредитов", ge=1, le=20)
    form: Optional[str] = Field(None, description="Форма обучения")
    is_elective: Optional[bool] = Field(None, description="Элективный курс")
    syllabus_link: Optional[str] = Field(None, description="Ссылка на силлабус")
    rpd_link: Optional[str] = Field(None, description="Ссылка на РПД")
    is_last: Optional[bool] = Field(None, description="Является ли курс заключающим в учебном плане")
    specialization_id: Optional[int] = Field(None, description="ID специализации")
    prerequisites_ids: Optional[list[int]] = Field(default=None, description="Список ID курсов-пререквизитов")
    tags_ids: Optional[list[int]] = Field(default=None, description="Список ID тегов курса")


class CourseResponseSchema(CourseBaseSchema):
    from .tag import TagBaseSchema
    TagBaseSchema: ClassVar

    tags: list[TagBaseSchema] = Field(default=[], description="Список тегов курса")
    prerequisites: list[CourseBaseSchema] = Field(default=[], description="Список курсов-пререквизитов")
