"""Scheme Ingestion & Version Immutability Pipeline"""

import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class IngestionDraftPayload(BaseModel):
    scheme_id: str
    slug: str
    ministry: str
    category: str
    target_beneficiaries: List[str]
    title: Dict[str, str]
    short_description: Dict[str, str]
    full_description: Dict[str, str]
    official_portal_url: str
    gazette_notification_url: Optional[str] = None
    source_reference_date: str
    document_raw_text: str
    funding_type: str = "CENTRAL_SECTOR"
    application_mode: str = "ONLINE"
    benefits: List[Dict[str, Any]]
    criteria: List[Dict[str, Any]]
    documents: List[Dict[str, Any]]
    chunks: List[Dict[str, Any]]


class IngestionPipeline:
    @staticmethod
    def compute_source_hash(raw_content: str) -> str:
        """Computes SHA-256 cryptographic hash of source document content."""
        return hashlib.sha256(raw_content.encode("utf-8")).hexdigest()

    @classmethod
    def prepare_ingestion_record(cls, payload: IngestionDraftPayload) -> Dict[str, Any]:
        """
        Validates and packages a new discovered scheme for human review.
        Status is strictly set to 'in_review' — never published automatically.
        """
        doc_hash = cls.compute_source_hash(payload.document_raw_text)

        scheme_record = {
            "id": payload.scheme_id,
            "slug": payload.slug,
            "ministry": payload.ministry,
            "category": payload.category,
            "target_beneficiaries": payload.target_beneficiaries,
            "status": "in_review",  # Human review required before publication
            "version_number": 1,
            "title": payload.title,
            "short_description": payload.short_description,
            "full_description": payload.full_description,
            "official_portal_url": payload.official_portal_url,
            "gazette_notification_url": payload.gazette_notification_url,
            "source_reference_date": payload.source_reference_date,
            "source_document_hash": doc_hash,
            "funding_type": payload.funding_type,
            "application_mode": payload.application_mode,
            "benefits": payload.benefits,
            "criteria": payload.criteria,
            "documents": payload.documents,
            "chunks": payload.chunks
        }
        return scheme_record

    @classmethod
    def create_version_increment(
        cls,
        current_scheme: Dict[str, Any],
        updated_data: Dict[str, Any],
        verifier_username: str,
        verification_notes: str
    ) -> Dict[str, Any]:
        """
        Creates an immutable new version without overwriting the historical version.
        Increments version_number, updates valid_from timestamp, and records verifier audit.
        """
        new_version_num = current_scheme.get("version_number", 1) + 1
        new_version_record = {**current_scheme, **updated_data}
        new_version_record["version_number"] = new_version_num
        new_version_record["valid_from"] = datetime.now(timezone.utc).isoformat()
        new_version_record["verified_by"] = verifier_username
        new_version_record["verification_notes"] = verification_notes
        new_version_record["status"] = "published"
        return new_version_record
