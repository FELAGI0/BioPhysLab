"""Настройки приложения BioPhysLab (pydantic-settings, загрузка из .env)."""

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Конфигурация приложения. Загружается из файла .env и переменных окружения."""

    # --- База данных ---
    # Порт 5434: контейнер публикуется на нём, т.к. 5432 на хосте занят локальным PostgreSQL.
    DATABASE_URL: str = "postgresql+asyncpg://biophyslab:biophyslab@localhost:5434/biophyslab"

    # --- AI-провайдер (ключ хранится только на сервере) ---
    AI_API_KEY: str = ""
    AI_PROVIDER: Literal["gemini", "openai"] = "gemini"
    AI_MODEL: str = "gemini-1.5-flash"
    # Base URL для OpenAI-совместимых запросов (можно указать свой прокси).
    AI_BASE_URL: str = "https://api.openai.com/v1"

    # --- Секрет для подписи cookie-сессий ---
    SECRET_KEY: str = "change-me"

    # --- Cookie-сессии ---
    SESSION_COOKIE_NAME: str = "biophyslab_sid"

    # --- AI-клиент ---
    AI_TIMEOUT_SECONDS: int = 30

    # --- Rate limit: запросов в час на одну cookie-сессию ---
    RATE_LIMIT_PER_HOUR: int = 30

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
