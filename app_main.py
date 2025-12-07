import uvicorn
from alembic import command
from alembic.config import Config

from app import init_app
from app.settings import settings


app = init_app()

if __name__ == "__main__":
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
    )
