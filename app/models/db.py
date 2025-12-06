from typing import AsyncIterator

from sqlalchemy.event import listen
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession, AsyncConnection

from ..settings import settings


def _build_async_db_uri(uri: str) -> str:
    if "+asyncpg" not in uri:
        return "+asyncpg:".join(uri.split(":", 1))
    return uri


_engine = create_async_engine(_build_async_db_uri(settings.DB_URL))
sessionmaker = async_sessionmaker(bind=_engine, class_=AsyncSession, expire_on_commit=False)


def create_session() -> AsyncSession:
    return sessionmaker()

async def get_session() -> AsyncIterator[AsyncSession]:
    session = create_session()
    try:
        yield session
    finally:
        await session.close()


is_listeners_set = False

async def init_db() -> None:
    global is_listeners_set

    async with _engine.begin() as conn:
        conn: AsyncConnection
        from .base import Base
        await conn.run_sync(Base.metadata.create_all)

    if is_listeners_set:
        return

    def before_flush_listener(session: AsyncSession, _, __) -> None:
        import asyncio

        for item in list(session.deleted):
            item: Base
            if hasattr(item, '_before_delete'):
                asyncio.create_task(item._before_delete(session))  # noqa W0212

    listen(sessionmaker(), "before_flush", before_flush_listener)
    is_listeners_set = True

async def disconnect_db() -> None:
    await _engine.dispose()
