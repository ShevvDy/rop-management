from .auth import GetAccessTokenSchema, GetRefreshTokenSchema, TokenResponseSchema
from .cohort import CohortBaseSchema, CohortCreateSchema, CohortUpdateSchema, CohortResponseSchema, CohortWithRelationsSchema, EducationPlanSchema, CohortStudentsResponseSchema, CohortStudentUpdateSchema
from .course import CourseBaseSchema, CourseCreateSchema, CourseUpdateSchema, CourseResponseSchema
from .faculty import FacultyBaseSchema, FacultyCreateSchema, FacultyUpdateSchema, FacultyResponseSchema
from .program import ProgramBaseSchema, ProgramCreateSchema, ProgramUpdateSchema, ProgramResponseSchema, ProgramWithRelationsSchema
from .specialization import SpecializationBaseSchema, SpecializationCreateSchema, SpecializationUpdateSchema, SpecializationResponseSchema
from .student import StudentBaseSchema, StudentCreateSchema, StudentUpdateSchema, StudentResponseSchema
from .tag import TagBaseSchema, TagCreateSchema, TagUpdateSchema
from .teacher import TeacherBaseSchema, TeacherCreateSchema, TeacherUpdateSchema, TeacherResponseSchema
from .user import UserBaseSchema, UserCreateSchema, UserUpdateSchema, UserResponseSchema, UserWithRelationsSchema

__all__ = [
    "GetAccessTokenSchema", "GetRefreshTokenSchema", "TokenResponseSchema",
    "CohortBaseSchema", "CohortCreateSchema", "CohortUpdateSchema", "CohortResponseSchema", "CohortWithRelationsSchema", "EducationPlanSchema",
    "CohortStudentsResponseSchema", "CohortStudentUpdateSchema",
    "CourseBaseSchema", "CourseCreateSchema", "CourseUpdateSchema", "CourseResponseSchema",
    "FacultyBaseSchema", "FacultyCreateSchema", "FacultyUpdateSchema", "FacultyResponseSchema",
    "ProgramBaseSchema", "ProgramCreateSchema", "ProgramUpdateSchema", "ProgramResponseSchema", "ProgramWithRelationsSchema",
    "SpecializationBaseSchema", "SpecializationCreateSchema", "SpecializationUpdateSchema", "SpecializationResponseSchema",
    "StudentBaseSchema", "StudentCreateSchema", "StudentUpdateSchema", "StudentResponseSchema",
    "TagBaseSchema", "TagCreateSchema", "TagUpdateSchema",
    "TeacherBaseSchema", "TeacherCreateSchema", "TeacherUpdateSchema", "TeacherResponseSchema",
    "UserBaseSchema", "UserCreateSchema", "UserUpdateSchema", "UserResponseSchema", "UserWithRelationsSchema",
]