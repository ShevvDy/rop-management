from typing import Iterator
from contextlib import asynccontextmanager

from neomodel import config, adb
from neomodel.async_.core import AsyncDatabase

from ..settings import settings


# Инициализация подключения к Neo4j
def init_neo4j_connection() -> None:
    """
    Инициализирует подключение к Neo4j через neomodel.
    Формат URL: bolt://neo4j:password@localhost:7687
    """
    config.DATABASE_URL = settings.DB_URL
    config.AUTO_INSTALL_LABELS = True  # Автоматически создавать индексы и ограничения


def get_neo4j_db() -> Iterator[AsyncDatabase]:
    """
    Dependency для получения асинхронного подключения к Neo4j.
    Использование:
        def my_endpoint(db: Database = Depends(get_neo4j_db)):
            ...
    """
    try:
        yield adb
    finally:
        pass  # neomodel управляет соединениями автоматически


@asynccontextmanager
async def neo4j_transaction():
    """
    Контекстный менеджер для транзакций Neo4j.
    Использование:
        with neo4j_transaction():
            # выполнение операций с БД
            node.save()
    """
    with adb.transaction:
        yield


async def init_neo4j_constraints() -> None:
    """
    Инициализирует ограничения и индексы в Neo4j.
    Вызывается при старте приложения.
    """
    try:
        # Проверяем существующие constraints
        result, _ = await adb.cypher_query("SHOW CONSTRAINTS", resolve_objects=False)
        print(result)
        existing_constraints = {row[1] for row in result if row}
        print(existing_constraints)

        # Создаём constraint для уникальности полей Faculty
        constraints_to_create = [
            ("Faculty", "faculty_id"),
            ("Faculty", "name"),
            ("Faculty", "short_name"),
            ("Program", "program_id"),
            ("Cohort", "cohort_id"),
            ("Course", "course_id"),
            ("Course", "code"),
            ("Semester", "semester_id"),
            ("Specialization", "specialization_id"),
            ("Tag", "tag_id"),
            ("Tag", "name"),
            ("Group", "group_id"),
            ("Stream", "stream_id"),
            ("User", "user_id"),
            ("User", "email"),
            ("User", "isu_id"),
            ("Teacher", "teacher_id"),
            ("Student", "student_id"),
            ("PlannedCourse", "planned_course_id"),
            ("Checkpoint", "checkpoint_id"),
            ("Team", "team_id"),
        ]

        for label, property_name in constraints_to_create:
            constraint_name = f"constraint_{label.lower()}_{property_name}"

            # Проверяем существует ли уже constraint
            if constraint_name not in existing_constraints:
                try:
                    query = f"""
                    CREATE CONSTRAINT {constraint_name} IF NOT EXISTS
                    FOR (n:{label})
                    REQUIRE n.{property_name} IS UNIQUE
                    """
                    await adb.cypher_query(query, resolve_objects=False)
                except Exception as e:
                    print(f"Warning: Could not create constraint {constraint_name}: {e}")

        print("Neo4j constraints initialized successfully")
    except Exception as e:
        print(f"Error initializing Neo4j constraints: {e}")


async def close_neo4j_connection() -> None:
    """
    Закрывает соединение с Neo4j.
    Вызывается при остановке приложения.
    """
    try:
        await adb.close_connection()
        print("Neo4j connection closed")
    except Exception as e:
        print(f"Error closing Neo4j connection: {e}")


async def async_cypher_query(query: str, params: dict | None = None):
    """
    Асинхронная обёртка для выполнения Cypher запросов.

    Args:
        query: Cypher запрос
        params: Параметры запроса

    Returns:
        Результаты запроса
    """
    return await adb.cypher_query(query, params or {})

