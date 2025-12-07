from pydantic import NonNegativeInt
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: NonNegativeInt = 5000

    DB_URL: str
    ISU_API_KEY: str

    class Config:
        env_file = ".env"


settings = Settings()
