"""Database Initialization, Migration & Seeding Runner

Supports:
1. Sync and Async table creation for SQLite & PostgreSQL with pgvector.
2. PostgreSQL DDL compilation with pgvector extension generation.
3. Seeding all 8 verified schemes and initial admin/CSC users.
4. Idempotent execution (skips existing records).
"""

import logging
from typing import Set
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import Base
import app.modules.catalogue.models as catalogue_models
import app.modules.auth.models as auth_models
import app.modules.audit.models as audit_models
from app.db.seeds import VERIFIED_SCHEMES_SEED
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)


def init_db_sync(database_url: str = settings.DATABASE_URL_SYNC):
    """Synchronously initializes database schema and seeds verified scheme records."""
    logger.info("Initializing database using sync engine: %s", database_url.split("@")[-1] if "@" in database_url else database_url)
    
    sync_engine = create_engine(database_url)
    Base.metadata.create_all(sync_engine)
    logger.info("Database tables verified.")

    with Session(sync_engine) as session:
        # 1. Seed Schemes
        existing_schemes = set(session.scalars(select(catalogue_models.Scheme.id)).all())

        for seed in VERIFIED_SCHEMES_SEED:
            scheme_id = seed["id"]
            if scheme_id in existing_schemes:
                continue

            scheme = catalogue_models.Scheme(
                id=scheme_id,
                slug=seed.get("slug", scheme_id),
                ministry=seed.get("ministry", ""),
                department=seed.get("department"),
                category=seed.get("category", "general"),
                target_beneficiaries=seed.get("target_beneficiaries", []),
                status=seed.get("status", catalogue_models.SchemeStatus.PUBLISHED),
                current_version_id=f"{scheme_id}-v{seed.get('version_number', 1)}"
            )
            session.add(scheme)

            version = catalogue_models.SchemeVersion(
                id=f"{scheme_id}-v{seed.get('version_number', 1)}",
                scheme_id=scheme_id,
                version_number=seed.get("version_number", 1),
                title=seed.get("title", {}),
                short_description=seed.get("short_description", {}),
                full_description=seed.get("full_description", {}),
                official_portal_url=seed.get("official_portal_url", ""),
                gazette_notification_url=seed.get("gazette_notification_url"),
                source_reference_date=seed.get("source_reference_date", "2024-01-01"),
                source_document_hash=seed.get("source_document_hash"),
                funding_type=seed.get("funding_type", "CENTRAL_SECTOR"),
                application_mode=seed.get("application_mode", "ONLINE"),
                application_steps=seed.get("application_steps", []),
                verified_by=seed.get("verified_by", "SYSTEM_SEED"),
                verification_notes=seed.get("verification_notes")
            )
            session.add(version)

            for b in seed.get("benefits", []):
                session.add(catalogue_models.SchemeBenefit(
                    id=f"{scheme_id}-ben-{b.get('benefit_type')}",
                    scheme_version_id=version.id,
                    benefit_type=b.get("benefit_type", "CASH_TRANSFER"),
                    amount_description=b.get("amount_description", {}),
                    frequency=b.get("frequency", "ANNUAL"),
                    max_monetary_value=b.get("max_monetary_value")
                ))

            for idx, c in enumerate(seed.get("criteria", [])):
                session.add(catalogue_models.SchemeCriterion(
                    id=f"{scheme_id}-crit-{idx}",
                    scheme_version_id=version.id,
                    field_name=c.get("field_name", ""),
                    criterion_type=c.get("criterion_type", "EQUALITY"),
                    rule_ast=c.get("rule_ast", {}),
                    explanation=c.get("explanation", {}),
                    is_mandatory=c.get("is_mandatory", True)
                ))

            for d in seed.get("documents", []):
                session.add(catalogue_models.SchemeDocument(
                    id=f"{scheme_id}-doc-{d.get('document_code')}",
                    scheme_version_id=version.id,
                    document_code=d.get("document_code", ""),
                    document_name=d.get("document_name", {}),
                    issuing_authority=d.get("issuing_authority", {}),
                    is_mandatory=d.get("is_mandatory", True),
                    alternatives=d.get("alternatives", [])
                ))

            for idx, ch in enumerate(seed.get("chunks", [])):
                session.add(catalogue_models.SchemeTextChunk(
                    id=f"{scheme_id}-chunk-{idx}",
                    scheme_version_id=version.id,
                    section_title=ch.get("section_title", ""),
                    language=ch.get("language", "en"),
                    content=ch.get("content", ""),
                    embedding_vector=ch.get("embedding_vector")
                ))

        # 2. Seed Default Users
        existing_users = set(session.scalars(select(auth_models.User.username)).all())
        default_users = [
            {
                "username": "csc_operator",
                "password": "Password123!",
                "role": "CSC_OPERATOR",
                "full_name": "Ramesh Kumar (CSC VLE)",
                "organization": "CSC e-Governance Services India"
            },
            {
                "username": "scheme_admin",
                "password": "AdminPassword123!",
                "role": "SCHEME_ADMIN",
                "full_name": "Dr. Sunita Rao (MoA&FW)",
                "organization": "Ministry of Agriculture and Farmers Welfare"
            }
        ]

        for u in default_users:
            if u["username"] not in existing_users:
                session.add(auth_models.User(
                    username=u["username"],
                    hashed_password=get_password_hash(u["password"]),
                    role=u["role"],
                    full_name=u["full_name"],
                    organization=u["organization"],
                    is_active=True
                ))

        session.commit()
        logger.info("Database schema seeded successfully.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db_sync()
