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
    DB_REQUIRE_SSL: bool = False
    DB_DISABLE_SSL: bool = False

    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # gemini | openai | local_mock
    LLM_MODEL: str = "gemini-2.5-flash-lite"
    LLM_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: Optional[str] = None
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
        origins = [origin.strip().rstrip("/") for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
        extra = [
            "https://schemesaathi.vercel.app",
            "https://scheme-saathi-six.vercel.app",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        for o in extra:
            if o not in origins:
                origins.append(o)
        return origins

    @property
    def supported_locales_list(self) -> List[str]:
        return [loc.strip() for loc in self.SUPPORTED_LOCALES.split(",") if loc.strip()]

    @staticmethod
    def sanitize_db_url(url: str) -> str:
        """
        Safely sanitizes database connection strings.
        If a database password contains unescaped special characters such as '@',
        standard URL parsers misinterpret everything after the first '@' as the hostname.
        This helper isolates the credentials from the network authority and percent-encodes
        the password so that both psycopg and asyncpg connect cleanly.
        """
        import urllib.parse
        if not url or "://" not in url:
            return url

        scheme, rest = url.split("://", 1)

        path_and_query = rest
        query = ""
        if "?" in path_and_query:
            path_and_query, query = path_and_query.split("?", 1)
            query = "?" + query

        if "/" in path_and_query:
            netloc, path = path_and_query.split("/", 1)
            path = "/" + path
        else:
            netloc, path = path_and_query, ""

        if "@" in netloc:
            parts = netloc.split("@")
            # In RFC 3986, hostnames cannot contain '@'. The last part is always host[:port].
            host_port = parts[-1]
            user_pass = "@".join(parts[:-1])
            if ":" in user_pass:
                user, pwd = user_pass.split(":", 1)
                # Decode first to avoid double-encoding %40 -> %2540
                unquoted_pwd = urllib.parse.unquote(pwd)
                encoded_pwd = urllib.parse.quote_plus(unquoted_pwd)
                user_pass = f"{user}:{encoded_pwd}"
            netloc = f"{user_pass}@{host_port}"

        return f"{scheme}://{netloc}{path}{query}"

    @model_validator(mode="after")
    def normalize_and_validate_database_urls(self):
        import urllib.parse

        # 0. Sanitize raw URLs against unescaped special characters in credentials
        self.DATABASE_URL = self.sanitize_db_url(self.DATABASE_URL.strip())
        self.DATABASE_URL_SYNC = self.sanitize_db_url(self.DATABASE_URL_SYNC.strip())

        # Resolve Gemini API Key & Model aliases if user set GEMINI_API_KEY / GEMINI_MODEL
        if self.GEMINI_API_KEY and not self.LLM_API_KEY:
            self.LLM_API_KEY = self.GEMINI_API_KEY
        if self.GEMINI_MODEL and (not self.LLM_MODEL or self.LLM_MODEL == "gemini-2.5-flash-lite"):
            self.LLM_MODEL = self.GEMINI_MODEL

        # 1. Normalize async DATABASE_URL
        url = self.DATABASE_URL
        require_ssl = False
        disable_ssl = False

        # Extract and remove sslmode query parameter if present (incompatible with asyncpg)
        if "sslmode=" in url.lower():
            parsed = urllib.parse.urlsplit(url)
            q_params = urllib.parse.parse_qsl(parsed.query)
            new_params = []
            for k, v in q_params:
                if k.lower() == "sslmode":
                    if v.lower() in ("require", "verify-ca", "verify-full", "prefer"):
                        require_ssl = True
                    elif v.lower() == "disable":
                        disable_ssl = True
                else:
                    new_params.append((k, v))
            new_query = urllib.parse.urlencode(new_params)
            url = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, new_query, parsed.fragment))

        # Standardize on asyncpg driver for PostgreSQL async engine
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]
        elif url.startswith("postgresql+psycopg://"):
            url = "postgresql+asyncpg://" + url[len("postgresql+psycopg://"):]

        self.DATABASE_URL = url
        if require_ssl:
            self.DB_REQUIRE_SSL = True
        if disable_ssl:
            self.DB_DISABLE_SSL = True

        # 2. Derive/normalize synchronous DATABASE_URL_SYNC for Alembic & sync initializers
        sync_url = self.DATABASE_URL_SYNC.strip()
        # Auto-derive if default SQLite or if DATABASE_URL_SYNC mistakenly still points to direct IPv6 supabase.co while DATABASE_URL uses IPv4 pooler
        should_derive = (
            sync_url.startswith("sqlite")
            or ("supabase.co" in sync_url and "pooler.supabase.com" in self.DATABASE_URL)
        ) and not self.DATABASE_URL.startswith("sqlite")

        if should_derive:
            # Automatically derive sync URL from async PostgreSQL URL
            if self.DATABASE_URL.startswith("postgresql+asyncpg://"):
                sync_url = "postgresql://" + self.DATABASE_URL[len("postgresql+asyncpg://"):]
            elif self.DATABASE_URL.startswith("postgresql+psycopg://"):
                sync_url = "postgresql://" + self.DATABASE_URL[len("postgresql+psycopg://"):]
        elif sync_url.startswith("postgres://"):
            sync_url = "postgresql://" + sync_url[len("postgres://"):]
        elif sync_url.startswith("postgresql+asyncpg://"):
            sync_url = "postgresql://" + sync_url[len("postgresql+asyncpg://"):]

        self.DATABASE_URL_SYNC = sync_url

        # 3. Production Configuration Guard
        if self.ENVIRONMENT.lower() in ("production", "prod"):
            if self.DATABASE_URL.startswith("sqlite"):
                raise ValueError(
                    "PRODUCTION CONFIGURATION GUARD: In 'production' environment, DATABASE_URL cannot silently fall back to SQLite. "
                    "A PostgreSQL 16 connection with pgvector is strictly required (e.g. postgresql+asyncpg://user:pass@host:5432/db)."
                )
        return self


settings = Settings()
