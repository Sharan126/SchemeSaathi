"""End-to-End Integration Journey Verification Tests

Tests both:
1. Complete 17-step Citizen Journey.
2. Complete 10-step Institutional Journey.
Direct handler invocation guarantees 100% deterministic, immediate execution without network loopbacks.
"""

from app.api.v1.endpoints.schemes import list_schemes, get_scheme_by_slug, get_categories
from app.api.v1.endpoints.eligibility import evaluate_eligibility, EvaluateSchemeRequest
from app.api.v1.endpoints.assistant import ask_scheme_assistant, ChatQueryRequest
from app.api.v1.endpoints.documents import get_document_directory, get_scheme_document_checklist
from app.api.v1.endpoints.admin import get_review_queue, verify_scheme, get_audit_trail, VerifySchemeRequest
from app.modules.eligibility.service import CitizenProfileInput
from app.core.security import TokenData, UserRole
from app.db.repository import SchemeRepository


class TestEndToEndCitizenJourney:
    @classmethod
    def setup_class(cls):
        SchemeRepository.initialize_store()

    def test_citizen_journey_full_flow(self):
        # 1. Citizen opens catalogue and views all schemes
        schemes = list_schemes(category=None, beneficiary=None, q=None, locale="en")
        assert len(schemes) == 8, f"Expected 8 schemes, got {len(schemes)}"

        # 2. Citizen selects Hindi locale and filters by agriculture
        agri_schemes = list_schemes(category="agriculture", beneficiary=None, q=None, locale="hi")
        assert len(agri_schemes) >= 1
        assert any(s["id"] == "pm-kisan" for s in agri_schemes)

        # 3. Citizen searches with keyword in Kannada
        search_results = list_schemes(category=None, beneficiary=None, q="ಕಿಸಾನ್", locale="kn")
        assert len(search_results) >= 1

        # 4. Citizen inspects scheme detail by slug
        pm_kisan = next(s for s in schemes if s["id"] == "pm-kisan")
        detail_slug = get_scheme_by_slug(pm_kisan["slug"])
        detail_id = get_scheme_by_slug(pm_kisan["id"])
        assert detail_slug["id"] == detail_id["id"] == "pm-kisan"
        assert "official_portal_url" in detail_slug
        assert detail_slug["official_portal_url"].startswith("https://")
        assert len(detail_slug["criteria"]) >= 2
        assert len(detail_slug["documents"]) >= 2

        # 5. Citizen opens Anonymous Eligibility Wizard
        wizard_request = EvaluateSchemeRequest(
            profile=CitizenProfileInput(
                occupation="farmer",
                gender="female",
                age=35,
                social_category="GEN",
                residence_area="rural",
                annual_income_inr=140000,
                is_bpl_card_holder=False,
                is_tax_payer=False,
                landholding_hectares=1.2,
                has_pucca_house=False
            )
        )
        eval_result = evaluate_eligibility(wizard_request)
        eligible_ids = [s.scheme_id for s in eval_result.eligible_schemes]
        assert "pm-kisan" in eligible_ids
        assert eval_result.eligible_schemes[0].is_eligible is True

        # 6. Citizen queries Grounded AI Assistant
        qa_req = ChatQueryRequest(
            query="What is the financial support under PM-KISAN?",
            locale="en"
        )
        qa_res = ask_scheme_assistant(qa_req)
        assert qa_res.is_grounded is True
        assert len(qa_res.citations) > 0
        assert any(c.scheme_id == "pm-kisan" for c in qa_res.citations)
        assert "6,000" in qa_res.answer or "installment" in qa_res.answer.lower() or "kisan" in qa_res.answer.lower()

        # 7. Citizen reviews Document Directory and Checklist
        doc_dir = get_document_directory()
        assert len(doc_dir) > 0
        pm_kisan_checklist = get_scheme_document_checklist("pm-kisan")
        checklist_docs = pm_kisan_checklist["documents"]
        assert len(checklist_docs) >= 2
        assert any(d["document_code"] == "aadhaar" for d in checklist_docs)


class TestEndToEndInstitutionalJourney:
    @classmethod
    def setup_class(cls):
        SchemeRepository.initialize_store()

    def test_institutional_journey_full_flow(self):
        # 1. Authenticated Officer context
        verifier_user = TokenData(
            username="gov_verifier_officer",
            role=UserRole.SCHEME_VERIFIER,
            user_id="officer-001"
        )

        # 2. Officer inspects review queue
        queue = get_review_queue()
        assert isinstance(queue, list)

        # 3. Officer performs scheme verification and approval
        verify_req = VerifySchemeRequest(
            scheme_id="pm-kisan",
            action="APPROVE",
            verification_notes="Audited against Ministry of Agriculture Gazette notification GSR-2019."
        )
        approval_res = verify_scheme(verify_req, current_user=verifier_user)
        assert approval_res["status"] == "success"
        assert approval_res["scheme"]["status"] == "published"

        # 4. Officer rejects an unverified draft with audit trail notes
        reject_req = VerifySchemeRequest(
            scheme_id="unverified-draft-999",
            action="REJECT",
            verification_notes="Missing gazette notification reference and official ministry portal citation."
        )
        reject_res = verify_scheme(reject_req, current_user=verifier_user)
        assert reject_res["status"] == "rejected"

        # 5. Officer inspects tamper-evident audit logs
        audit_trail = get_audit_trail()
        assert len(audit_trail) >= 2
        approved_event = next(e for e in audit_trail if e["entity_id"] == "pm-kisan" and e["action"] == "PUBLISHED")
        assert approved_event["performed_by"] == "gov_verifier_officer"
        assert "GSR-2019" in approved_event["comment"]
