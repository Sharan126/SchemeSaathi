"""Audit Trail and Administrative Event Models"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import String, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type: Mapped[str] = mapped_column(String(64), index=True)  # "scheme", "scheme_version", "criterion"
    entity_id: Mapped[str] = mapped_column(String(64), index=True)
    action: Mapped[str] = mapped_column(String(64), index=True)  # CREATED, EXTRACTED, REVIEWED, VERIFIED, PUBLISHED
    performed_by: Mapped[str] = mapped_column(String(128))  # username or SYSTEM
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    changes: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
