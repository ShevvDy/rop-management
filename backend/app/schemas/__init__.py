from .cohort import CohortBaseSchema, CohortCreateSchema, CohortUpdateSchema, CohortResponseSchema, CohortWithRelationsSchema, EducationPlanSchema
from .course import CourseBaseSchema, CourseCreateSchema, CourseUpdateSchema, CourseResponseSchema
from .faculty import FacultyBaseSchema, FacultyCreateSchema, FacultyUpdateSchema, FacultyResponseSchema
from .group import GroupBaseSchema, GroupCreateSchema, GroupUpdateSchema, GroupResponseSchema, GroupWithRelationsSchema
from .program import ProgramBaseSchema, ProgramCreateSchema, ProgramUpdateSchema, ProgramResponseSchema, ProgramWithRelationsSchema
from .specialization import SpecializationBaseSchema, SpecializationCreateSchema, SpecializationUpdateSchema, SpecializationResponseSchema, SpecializationWithRelationsSchema
from .student import StudentBaseSchema, StudentCreateSchema, StudentUpdateSchema, StudentResponseSchema
from .tag import TagBaseSchema, TagCreateSchema, TagUpdateSchema
from .teacher import TeacherBaseSchema, TeacherCreateSchema, TeacherUpdateSchema, TeacherResponseSchema
from .user import UserBaseSchema, UserCreateSchema, UserUpdateSchema, UserResponseSchema, UserWithRelationsSchema

__all__ = [
    "CohortBaseSchema", "CohortCreateSchema", "CohortUpdateSchema", "CohortResponseSchema", "CohortWithRelationsSchema", "EducationPlanSchema",
    "CourseBaseSchema", "CourseCreateSchema", "CourseUpdateSchema", "CourseResponseSchema",
    "FacultyBaseSchema", "FacultyCreateSchema", "FacultyUpdateSchema", "FacultyResponseSchema",
    "GroupBaseSchema", "GroupCreateSchema", "GroupUpdateSchema", "GroupResponseSchema", "GroupWithRelationsSchema",
    "ProgramBaseSchema", "ProgramCreateSchema", "ProgramUpdateSchema", "ProgramResponseSchema", "ProgramWithRelationsSchema",
    "SpecializationBaseSchema", "SpecializationCreateSchema", "SpecializationUpdateSchema", "SpecializationResponseSchema", "SpecializationWithRelationsSchema",
    "StudentBaseSchema", "StudentCreateSchema", "StudentUpdateSchema", "StudentResponseSchema",
    "TagBaseSchema", "TagCreateSchema", "TagUpdateSchema",
    "TeacherBaseSchema", "TeacherCreateSchema", "TeacherUpdateSchema", "TeacherResponseSchema",
    "UserBaseSchema", "UserCreateSchema", "UserUpdateSchema", "UserResponseSchema", "UserWithRelationsSchema",
]