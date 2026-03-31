import re

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from neomodel.exceptions import UniqueProperty
from pydantic import ValidationError

from .base import (
    AppException,
    NotFoundException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    UnauthorizedException,
    ForeignKeyException,
)


def init_exceptions(app: FastAPI):
    """Инициализация обработчиков исключений для приложения"""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(ValidationError)
    async def validation_exception_handler(request: Request, exc: ValidationError):
        return JSONResponse(
            status_code=422,
            content={"detail": exc.errors()}
        )

    @app.exception_handler(UniqueProperty)
    async def unique_property_exception_handler(request: Request, exc: UniqueProperty):
        error_info = str(exc)
        # Пытаемся извлечь имя поля и значение из сообщения UniqueProperty
        match = re.search(r"property `([^`]+)` = '([^']+)'", error_info)
        if match:
            field_name, field_value = match.groups()
            detail = f"Запись со значением '{field_value}' поля '{field_name}' уже существует"
        else:
            detail = "Запись с такими данными уже существует"

        return JSONResponse(
            status_code=400,
            content={"detail": detail}
        )


__all__ = [
    "init_exceptions",
    "AppException",
    "NotFoundException",
    "BadRequestException",
    "ConflictException",
    "ForbiddenException",
    "UnauthorizedException",
    "ForeignKeyException",
]
