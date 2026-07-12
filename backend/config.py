"""
Configuration — loads environment variables via Pydantic settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./db/custom.db"

    # Anakin API
    anakin_api_key: str = ""

    # Adzuna API
    adzuna_app_id: str = ""
    adzuna_app_key: str = ""
    adzuna_country: str = "in"

    # Gemini API
    gemini_api_key: str = ""

    # Auth
    jwt_secret: str = "jobpulse-jwt-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 168  # 7 days

    # Cron
    cron_secret: str = "jobpulse-cron-secret-2026"

    # Vector DB
    vector_db_path: str = "./db/vectors.db"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
