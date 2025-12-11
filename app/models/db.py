from typing import AsyncIterator

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession, AsyncConnection

from ..settings import settings


_engine = create_async_engine("postgresql+asyncpg://" + settings.DB_URL.split("://", 1)[1])
sessionmaker = async_sessionmaker(bind=_engine, class_=AsyncSession, expire_on_commit=False)


def create_session() -> AsyncSession:
    return sessionmaker()

async def get_session() -> AsyncIterator[AsyncSession]:
    session = create_session()
    try:
        yield session
    finally:
        await session.close()


async def init_db() -> None:
    async with _engine.begin() as conn:
        conn: AsyncConnection
        from .base import Base
        await conn.run_sync(Base.metadata.create_all)

async def disconnect_db() -> None:
    await _engine.dispose()
