"""Institutional Administration & Scheme Verification Desk"""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.security import require_roles, TokenData, UserRole
from app.db.repository import SchemeRepository

router = APIRouter(prefix="/admin", tags=["Admin"])


class VerifySchemeRequest(BaseModel):
    scheme_id: str
    action: str  # "APPROVE" | "REJECT"
    verification_notes: str


@router.get("/review-queue", dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.SCHEME_VERIFIER))])
def get_review_queue():
    """Lists draft and extracted schemes currently awaiting human verification."""
    return SchemeRepository.get_review_queue()


@router.post("/verify")
def verify_scheme(
    request: VerifySchemeRequest,
    current_user: TokenData = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.SCHEME_VERIFIER))
):
    """
    Human-in-the-loop verification gate.
    Approves or rejects a discovered scheme before publication.
    Enforces signature provenance and writes to immutable audit trail.
    """
    if request.action == "APPROVE":
        res = SchemeRepository.publish_or_update(
            scheme_id=request.scheme_id,
            verifier_user=current_user.username,
            notes=request.verification_notes
        )
        if not res:
            raise HTTPException(status_code=404, detail="Scheme not found")
        return {
            "status": "success",
            "message": f"Scheme '{request.scheme_id}' verified and published by {current_user.username}",
            "scheme": res
        }
    else:
        SchemeRepository.record_audit(
            entity_type="scheme",
            entity_id=request.scheme_id,
            action="REJECTED",
            performed_by=current_user.username,
            comment=request.verification_notes
        )
        return {
            "status": "rejected",
            "message": f"Scheme '{request.scheme_id}' marked as rejected with notes recorded."
        }


@router.get("/audit-logs", dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN))])
def get_audit_trail():
    """Returns tamper-evident chronological audit logs of all administrative actions."""
    return SchemeRepository.get_audit_logs()
