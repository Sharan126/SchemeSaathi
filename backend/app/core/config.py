"""SchemeSaathi Application Configuration Settings"""

import os
from typing import List, Optional, Any
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: Any = True
    APP_NAME: str = "SchemeSaathi"
    APP_URL: str = "http://localhost:3000"
    API_BASE_URL: str = "http://localhost:8000/api/v1"
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./schemesaathi.db"
    DATABASE_URL_SYNC: str = "sqlite:///./schemesaathi.db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 5
    DB_POOL_TIMEOUT: int = 30

    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # gemini | openai | local_mock
    LLM_MODEL: str = "gemini-2.5-flash-lite"
    LLM_API_KEY: Optional[str] = None
    LLM_TEMPERATURE: float = 0.0
    LLM_MAX_TOKENS: int = 1024

    # Embedding & Retrieval
    EMBEDDING_PROVIDER: str = "local_sentence_transformers"
    EMBEDDING_MODEL: str = "paraphrase-multilingual-mpnet-base-v2"
    EMBEDDING_DIMENSIONS: int = 768
    VECTOR_SIMILARITY_THRESHOLD: float = 0.60

    # Storage
    STORAGE_BACKEND: str = "local"
    STORAGE_BUCKET_NAME: str = "schemesaathi-documents"
    STORAGE_ENDPOINT_URL: str = "http://localhost:9000"
    STORAGE_ACCESS_KEY: Optional[str] = "minioadmin"
    STORAGE_SECRET_KEY: Optional[str] = "minioadmin"

    # Security & JWT
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Multilingual & Locales
    DEFAULT_LOCALE: str = "en"
    SUPPORTED_LOCALES: str = "en,hi,kn"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def supported_locales_list(self) -> List[str]:
        return [loc.strip() for loc in self.SUPPORTED_LOCALES.split(",") if loc.strip()]

    @model_validator(mode="after")
    def validate_production_guards(self):
        if self.ENVIRONMENT.lower() in ("production", "prod"):
            if self.DATABASE_URL.startswith("sqlite"):
                raise ValueError(
                    "PRODUCTION CONFIGURATION GUARD: In 'production' environment, DATABASE_URL cannot silently fall back to SQLite. "
                    "A PostgreSQL 16 connection with pgvector is strictly required (e.g. postgresql+asyncpg://user:pass@host:5432/db)."
                )
        return self


settings = Settings()
