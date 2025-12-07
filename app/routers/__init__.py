from fastapi import FastAPI

from .cohort import router as cohort_router
from .course import router as course_router
from .faculty import router as faculty_router
from .group import router as group_router
from .program import router as program_router
from .semester import router as semester_router
from .specialization import router as specialization_router
from .stream import router as stream_router
from .student import router as student_router
from .tag import router as tag_router
from .teacher import router as teacher_router
from .user import router as user_router


def init_routers(app: FastAPI) -> None:
    """Инициализация всех роутеров приложения"""
    app.include_router(cohort_router)
    app.include_router(course_router)
    app.include_router(faculty_router)
    app.include_router(group_router)
    app.include_router(program_router)
    app.include_router(semester_router)
    app.include_router(specialization_router)
    app.include_router(stream_router)
    app.include_router(student_router)
    app.include_router(tag_router)
    app.include_router(teacher_router)
    app.include_router(user_router)


__all__ = ["init_routers"]
