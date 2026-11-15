"""Scheme Catalogue, Versioning, Criteria, and Document Data Models"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SchemeStatus:
    DISCOVERED = "discovered"
    EXTRACTED = "extracted"
    IN_REVIEW = "in_review"
    VERIFIED = "verified"
    PUBLISHED = "published"
    DEPRECATED = "deprecated"


class Scheme(Base):
    __tablename__ = "schemes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # e.g., "pm-kisan"
    slug: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    ministry: Mapped[str] = mapped_column(String(256), index=True)
    department: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)
    category: Mapped[str] = mapped_column(String(128), index=True)  # agriculture, health, education, etc.
    target_beneficiaries: Mapped[List[str]] = mapped_column(JSON, default=list)  # ["farmers", "rural"]
    status: Mapped[str] = mapped_column(String(32), default=SchemeStatus.DISCOVERED, index=True)
    current_version_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    versions: Mapped[List["SchemeVersion"]] = relationship(
        "SchemeVersion", back_populates="scheme", cascade="all, delete-orphan", order_by="desc(SchemeVersion.version_number)"
    )


class SchemeVersion(Base):
    __tablename__ = "scheme_versions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheme_id: Mapped[str] = mapped_column(String(64), ForeignKey("schemes.id", ondelete="CASCADE"), index=True)
    version_number: Mapped[int] = mapped_column(Integer, default=1)
    
    # Multilingual Strings stored as JSON dictionaries: {"en": "...", "hi": "...", "kn": "..."}
    title: Mapped[Dict[str, str]] = mapped_column(JSON, nullable=False)
    short_description: Mapped[Dict[str, str]] = mapped_column(JSON, nullable=False)
    full_description: Mapped[Dict[str, str]] = mapped_column(JSON, nullable=False)
    
    # Official Source Provenance
    official_portal_url: Mapped[str] = mapped_column(String(512), nullable=False)
    gazette_notification_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    source_reference_date: Mapped[str] = mapped_column(String(32), nullable=False)  # ISO Date e.g. "2024-02-01"
    source_document_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # SHA-256
    
    # Administrative & Application Details
    funding_type: Mapped[str] = mapped_column(String(64), default="CENTRAL_SECTOR")  # CENTRAL_SECTOR, CENTRALLY_SPONSORED
    application_mode: Mapped[str] = mapped_column(String(32), default="ONLINE")  # ONLINE, OFFLINE, BOTH
    application_steps: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    
    # Verification & Lifecycle
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    verification_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Navigation relationships
    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="versions")
    benefits: Mapped[List["SchemeBenefit"]] = relationship("SchemeBenefit", back_populates="version", cascade="all, delete-orphan")
    criteria: Mapped[List["SchemeCriterion"]] = relationship("SchemeCriterion", back_populates="version", cascade="all, delete-orphan")
    documents: Mapped[List["SchemeDocument"]] = relationship("SchemeDocument", back_populates="version", cascade="all, delete-orphan")
    chunks: Mapped[List["SchemeTextChunk"]] = relationship("SchemeTextChunk", back_populates="version", cascade="all, delete-orphan")


class SchemeBenefit(Base):
    __tablename__ = "scheme_benefits"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheme_version_id: Mapped[str] = mapped_column(String(64), ForeignKey("scheme_versions.id", ondelete="CASCADE"), index=True)
    benefit_type: Mapped[str] = mapped_column(String(64))  # CASH_TRANSFER, SUBSIDY, INSURANCE, SCHOLARSHIP, IN_KIND
    amount_description: Mapped[Dict[str, str]] = mapped_column(JSON)  # {"en": "Rs 6,000/yr in 3 installments", ...}
    frequency: Mapped[str] = mapped_column(String(32))  # ANNUAL, MONTHLY, ONE_TIME, PER_EVENT
    max_monetary_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    version: Mapped["SchemeVersion"] = relationship("SchemeVersion", back_populates="benefits")


class SchemeCriterion(Base):
    __tablename__ = "scheme_criteria"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheme_version_id: Mapped[str] = mapped_column(String(64), ForeignKey("scheme_versions.id", ondelete="CASCADE"), index=True)
    field_name: Mapped[str] = mapped_column(String(64), index=True)  # e.g., "occupation", "landholding_hectares", "annual_income_inr"
    criterion_type: Mapped[str] = mapped_column(String(32))  # NUMERIC_RANGE, EQUALITY, SET_MEMBERSHIP, BOOLEAN
    rule_ast: Mapped[Dict[str, Any]] = mapped_column(JSON)  # JSONLogic Abstract Syntax Tree
    explanation: Mapped[Dict[str, str]] = mapped_column(JSON)  # Localized explanation string
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True)

    version: Mapped["SchemeVersion"] = relationship("SchemeVersion", back_populates="criteria")


class SchemeDocument(Base):
    __tablename__ = "scheme_documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheme_version_id: Mapped[str] = mapped_column(String(64), ForeignKey("scheme_versions.id", ondelete="CASCADE"), index=True)
    document_code: Mapped[str] = mapped_column(String(64), index=True)  # "aadhaar", "land_record", "income_cert"
    document_name: Mapped[Dict[str, str]] = mapped_column(JSON)
    issuing_authority: Mapped[Dict[str, str]] = mapped_column(JSON)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True)
    alternatives: Mapped[List[str]] = mapped_column(JSON, default=list)

    version: Mapped["SchemeVersion"] = relationship("SchemeVersion", back_populates="documents")


class SchemeTextChunk(Base):
    __tablename__ = "scheme_text_chunks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheme_version_id: Mapped[str] = mapped_column(String(64), ForeignKey("scheme_versions.id", ondelete="CASCADE"), index=True)
    section_title: Mapped[str] = mapped_column(String(128))
    language: Mapped[str] = mapped_column(String(8), default="en", index=True)
    content: Mapped[str] = mapped_column(Text)
    embedding_vector: Mapped[Optional[List[float]]] = mapped_column(JSON, nullable=True)  # Vector representation

    version: Mapped["SchemeVersion"] = relationship("SchemeVersion", back_populates="chunks")
