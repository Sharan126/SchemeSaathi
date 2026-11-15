"""Unit & Functional Tests for SchemeSaathi API Handlers"""

import asyncio
from app.api.v1.endpoints.schemes import list_schemes, get_scheme_by_slug, get_categories
from app.api.v1.endpoints.eligibility import evaluate_eligibility, EvaluateSchemeRequest
from app.api.v1.endpoints.assistant import ask_scheme_assistant, ChatQueryRequest
from app.api.v1.endpoints.documents import get_document_directory, get_scheme_document_checklist
from app.modules.eligibility.service import CitizenProfileInput
from app.core.security import TokenData, UserRole
from app.api.v1.endpoints.admin import verify_scheme, VerifySchemeRequest


def test_list_schemes_and_filtering():
    # All schemes
    schemes = list_schemes(category=None, beneficiary=None, q=None, locale="en")
    assert len(schemes) >= 7

    # Filter by category
    agri_schemes = list_schemes(category="agriculture", beneficiary=None, q=None, locale="en")
    assert any(s["id"] == "pm-kisan" for s in agri_schemes)

    # Categories count
    cats = get_categories()
    assert len(cats) >= 5


def test_scheme_detail_by_slug():
    data = get_scheme_by_slug("pradhan-mantri-kisan-samman-nidhi")
    assert data["id"] == "pm-kisan"
    assert "official_portal_url" in data
    assert len(data["criteria"]) >= 2
    assert len(data["documents"]) >= 2


def test_deterministic_eligibility_api():
    # Eligible farmer profile
    payload = EvaluateSchemeRequest(
        profile=CitizenProfileInput(
            occupation="farmer",
            landholding_hectares=1.5,
            is_tax_payer=False
        )
    )
    res = evaluate_eligibility(payload)
    eligible_ids = [s.scheme_id for s in res.eligible_schemes]
    assert "pm-kisan" in eligible_ids

    # Disqualified profile: farmer who pays income tax
    disqualified_payload = EvaluateSchemeRequest(
        profile=CitizenProfileInput(
            occupation="farmer",
            landholding_hectares=1.5,
            is_tax_payer=True
        )
    )
    res2 = evaluate_eligibility(disqualified_payload)
    ineligible_ids = [s.scheme_id for s in res2.ineligible_schemes]
    assert "pm-kisan" in ineligible_ids


def test_grounded_rag_assistant_with_citations():
    req = ChatQueryRequest(
        query="How much health cover is given under Ayushman Bharat?",
        locale="en"
    )
    res = ask_scheme_assistant(req)
    assert res.is_grounded is True
    assert len(res.citations) >= 1
    assert "5" in res.answer  # Mentions 5 Lakhs


def test_document_directory_and_checklist():
    docs = get_document_directory()
    assert len(docs) >= 4

    checklist = get_scheme_document_checklist("pm-kisan")
    assert checklist["scheme_id"] == "pm-kisan"
    assert len(checklist["documents"]) >= 2


def test_admin_verification_action():
    mock_user = TokenData(username="test_verifier", role=UserRole.SCHEME_VERIFIER, user_id="u1")
    req = VerifySchemeRequest(
        scheme_id="pm-kisan",
        action="APPROVE",
        verification_notes="Reviewed against latest agriculture ministry gazette notification."
    )
    res = verify_scheme(req, current_user=mock_user)
    assert res["status"] == "success"
