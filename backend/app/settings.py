from pydantic import NonNegativeInt
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: NonNegativeInt = 5000
    DOCS_URL: str | None = "/docs"

    DB_URL: str
    ISU_API_KEY: str
    JWT_SECRET_KEY: str

    YANDEX_CLIENT_ID: str
    YANDEX_CLIENT_SECRET: str
    YANDEX_AUTH_URL: str = "https://oauth.yandex.ru/authorize"
    YANDEX_TOKEN_URL: str = "https://oauth.yandex.ru/token"
    YANDEX_INFO_URL: str = "https://login.yandex.ru/info?format=json"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
