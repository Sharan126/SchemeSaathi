"""Database Engine, Session Management, and Async Connection Pool"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


class Base(DeclarativeBase):
    pass


# Build async engine configuration
connect_args = {}
engine_kwargs = {"echo": False, "future": True}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    engine_kwargs.update({
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
    })
    # Configure SSL for asyncpg when connecting to cloud-hosted databases (Supabase, Neon, Render)
    if "asyncpg" in settings.DATABASE_URL:
        is_remote_cloud = any(h in settings.DATABASE_URL for h in ("supabase.co", "neon.tech", "render.com", ".rds.amazonaws.com", "pooler.supabase.com"))
        if (is_remote_cloud or getattr(settings, "DB_REQUIRE_SSL", False)) and not getattr(settings, "DB_DISABLE_SSL", False):
            connect_args.setdefault("ssl", "require")

engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs
)

async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
