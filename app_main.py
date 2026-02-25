import uvicorn

from app import init_app
from app.settings import settings


app = init_app()

if __name__ == "__main__":
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
    )
