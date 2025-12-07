from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from .exceptions import init_exceptions
from .models import disconnect_db, init_db
from .routers import init_routers


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    await init_db()
    yield
    await disconnect_db()


def init_app() -> FastAPI:
    """Инициализация и настройка FastAPI приложения"""
    app = FastAPI(
        title="API приложения для управления образовательной программой",
        description="API для управления учебными программами",
        version="1.0.0",
        lifespan=lifespan
    )

    init_exceptions(app)
    init_routers(app)

    return app


__all__ = ["init_app"]
