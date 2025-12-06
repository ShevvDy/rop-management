from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_URL: str
    ISU_API_KEY: str

    class Config:
        env_file = ".env"


settings = Settings()
