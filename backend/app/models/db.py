from typing import Iterator
from contextlib import asynccontextmanager

from neomodel import config, adb
from neomodel.async_.core import AsyncDatabase
from neomodel.properties import Property
from neomodel.async_.relationship_manager import AsyncRelationshipDefinition

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
    Автоматически создаёт уникальные constraint'ы для всех свойств моделей с unique_index=True и удаляет лишние.
    """
    from .base_node import BaseNode

    try:
        # Проверяем существующие constraints
        result, _ = await adb.cypher_query("SHOW CONSTRAINTS", resolve_objects=False)
        existing_constraints = {row[1] for row in result if row}

        # Собираем все пары (label, property) с unique_index=True
        desired_constraints: set[str] = set()
        unique_fields: list[tuple[str, str]] = []
        for model in BaseNode.__subclasses__():
            label = model.__name__
            for attr_name in dir(model):
                attr = getattr(model, attr_name)
                if isinstance(attr, Property) and getattr(attr, "unique_index", False):
                    unique_fields.append((label, attr_name))
                    desired_constraints.add(f"constraint_{label.lower()}_{attr_name}")

        # Удаляем лишние constraints с нашим префиксом, которых больше нет в моделях
        for constraint_name in existing_constraints:
            if constraint_name.startswith("constraint_") and constraint_name not in desired_constraints:
                try:
                    await adb.cypher_query(f"DROP CONSTRAINT {constraint_name} IF EXISTS", resolve_objects=False)
                    print(f"Dropped obsolete constraint {constraint_name}")
                except Exception as e:
                    print(f"Warning: Could not drop constraint {constraint_name}: {e}")

        # Создаём недостающие constraints
        for label, property_name in unique_fields:
            constraint_name = f"constraint_{label.lower()}_{property_name}"
            if constraint_name in existing_constraints:
                continue
            try:
                query = f"""
                CREATE CONSTRAINT {constraint_name} IF NOT EXISTS
                FOR (n:{label})
                REQUIRE n.{property_name} IS UNIQUE
                """
                await adb.cypher_query(query, resolve_objects=False)
                print(f"Created constraint {constraint_name}")
            except Exception as e:
                print(f"Warning: Could not create constraint {constraint_name}: {e}")

        print("Neo4j constraints initialized successfully")
    except Exception as e:
        print(f"Error initializing Neo4j constraints: {e}")


async def init_neo4j_relationship_types() -> None:
    """Создаёт отсутствующие в БД типы связей, определённые в моделях neomodel."""
    from .base_node import BaseNode

    try:
        # Получаем все зарегистрированные типы отношений в БД
        result, _ = await adb.cypher_query(
            "CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType",
            resolve_objects=False,
        )
        existing_types = {row[0] for row in result if row}

        # Собираем названия связей из моделей
        desired_types: set[str] = set()
        for model in BaseNode.__subclasses__():
            for attr_name in dir(model):
                attr = getattr(model, attr_name)
                if isinstance(attr, AsyncRelationshipDefinition):
                    rel_type = attr.definition.get("relation_type")
                    if rel_type:
                        desired_types.add(rel_type)

        # Создаём отсутствующие типы через seed-отношения, чтобы тип сохранился в БД
        for rel_type in desired_types:
            if rel_type in existing_types:
                continue
            try:
                query = f"""
                MERGE (a:__REL_TYPE_SEED__ {{type: '{rel_type}'}})
                MERGE (b:__REL_TYPE_SEED__ {{type: '{rel_type}_dst'}})
                MERGE (a)-[:{rel_type}]->(b)
                """
                await adb.cypher_query(query, resolve_objects=False)
                print(f"Created relationship type {rel_type}")
            except Exception as e:
                print(f"Warning: Could not create relationship type {rel_type}: {e}")

        print("Neo4j relationship types initialized successfully")
    except Exception as e:
        print(f"Error initializing Neo4j relationship types: {e}")


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
