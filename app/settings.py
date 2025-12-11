from pydantic import NonNegativeInt
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: NonNegativeInt = 5000
    DOCS_URL: str | None = "/docs"

    DB_URL: str
    ISU_API_KEY: str

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
