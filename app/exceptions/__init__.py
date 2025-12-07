from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, DataError
from pydantic import ValidationError

from .base import (
    AppException,
    NotFoundException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    UnauthorizedException,
    UniqueConstraintException,
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

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        error_info = str(exc.orig)

        # Обработка нарушения уникальности
        if 'unique constraint' in error_info.lower() or 'duplicate key' in error_info.lower():
            if 'Key (' in error_info:
                field_name = error_info.split('Key (')[1].split(')')[0]
                return JSONResponse(
                    status_code=400,
                    content={"detail": f"Запись с таким значением поля '{field_name}' уже существует"}
                )
            return JSONResponse(
                status_code=400,
                content={"detail": "Запись с такими данными уже существует"}
            )

        # Обработка нарушения внешних ключей при добавлении/обновлении
        if 'foreign key constraint' in error_info.lower() or 'violates foreign key' in error_info.lower():
            if 'is still referenced' in error_info.lower():
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Невозможно удалить запись, так как на неё ссылаются другие записи"}
                )
            if 'Key (' in error_info:
                field_name = error_info.split('Key (')[1].split(')')[0]
                return JSONResponse(
                    status_code=400,
                    content={"detail": f"Указанная ссылка в поле '{field_name}' не существует"}
                )
            return JSONResponse(
                status_code=400,
                content={"detail": "Ссылка на несуществующую запись"}
            )

        # Общая ошибка целостности данных
        return JSONResponse(
            status_code=400,
            content={"detail": "Нарушение целостности данных"}
        )

    @app.exception_handler(DataError)
    async def data_error_handler(request: Request, exc: DataError):
        return JSONResponse(
            status_code=400,
            content={"detail": "Неверный формат данных"}
        )


__all__ = [
    "init_exceptions",
    "AppException",
    "NotFoundException",
    "BadRequestException",
    "ConflictException",
    "ForbiddenException",
    "UnauthorizedException",
    "UniqueConstraintException",
    "ForeignKeyException",
]
