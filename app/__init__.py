from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI

from .models import disconnect_db, init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    await init_db()
    yield
    await disconnect_db()
