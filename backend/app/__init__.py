from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from .exceptions import init_exceptions
from .models import init_neo4j_connection, close_neo4j_connection, init_neo4j_constraints, init_neo4j_relationship_types
from .routers import init_routers
from .settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    # Инициализация Neo4j
    init_neo4j_connection()
    await init_neo4j_constraints()
    await init_neo4j_relationship_types()

    yield

    # Закрытие соединения с Neo4j
    await close_neo4j_connection()


def init_app() -> FastAPI:
    """Инициализация и настройка FastAPI приложения"""
    app = FastAPI(
        title="API приложения для управления образовательной программой",
        description="API для управления учебными программами",
        version="1.0.0",
        lifespan=lifespan,
        root_path="/api/v1",
        docs_url=settings.DOCS_URL,
    )

    init_exceptions(app)
    init_routers(app)

    return app


__all__ = ["init_app"]
