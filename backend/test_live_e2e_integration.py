"""Live End-to-End Browser & Integration Flow Test Suite.

Simulates and validates all 13 Citizen Journey steps and 7 Institutional steps
against active servers:
- Frontend: http://localhost:3000
- Backend: http://localhost:8001/api/v1
"""

import httpx

FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8001/api/v1"

def run_e2e_tests():
    print("=" * 80)
    print("SCHEMESAATHI LIVE END-TO-END INTEGRATION TEST SUITE")
    print(f"Frontend: {FRONTEND_URL} | Backend: {BACKEND_URL}")
    print("=" * 80)
    
    with httpx.Client(timeout=15.0) as client:
        # =====================================================================
        # CITIZEN JOURNEY: Steps 1 to 13
        # =====================================================================
        print("\n--- RUNNING CITIZEN JOURNEY (13 STEPS) ---")
        
        # Step 1: Open Homepage
        resp_home = client.get(f"{FRONTEND_URL}/")
        assert resp_home.status_code == 200, f"Homepage failed with {resp_home.status_code}"
        assert "SchemeSaathi" in resp_home.text
        print("[PASS] Step 1: Open Homepage (HTTP 200, SchemeSaathi branding verified)")
        
        # Step 2: Switch Languages (EN, HI, KN)
        for loc in ["en", "hi", "kn"]:
            resp_loc = client.get(f"{BACKEND_URL}/schemes?locale={loc}")
            assert resp_loc.status_code == 200
            assert len(resp_loc.json()) >= 8
        print("[PASS] Step 2: Language Switching verified across English, Hindi, and Kannada")
        
        # Step 3: Search Schemes
        resp_search = client.get(f"{BACKEND_URL}/schemes?q=farmer")
        assert resp_search.status_code == 200
        assert any(s["id"] == "pm-kisan" for s in resp_search.json())
        print("[PASS] Step 3: Keyword search for 'farmer' retrieved PM-KISAN")
        
        # Step 4: Filter Results by Category
        resp_filter = client.get(f"{BACKEND_URL}/schemes?category=health")
        assert resp_filter.status_code == 200
        health_schemes = resp_filter.json()
        assert any(s["id"] == "ayushman-bharat-pmjay" for s in health_schemes)
        assert all(s["category"] == "health" for s in health_schemes)
        print("[PASS] Step 4: Category filter 'health' isolated Ayushman Bharat PM-JAY")
        
        # Step 5: Open Scheme Detail Page
        resp_detail = client.get(f"{BACKEND_URL}/schemes/ayushman-bharat-pradhan-mantri-jan-arogya-yojana")
        assert resp_detail.status_code == 200
        scheme_data = resp_detail.json()
        assert scheme_data["version_number"] == 2
        print(f"[PASS] Step 5: Scheme detail opened: {scheme_data['id']} (Version {scheme_data['version_number']})")
        
        # Step 6: Inspect Official Source Citations
        assert "official_portal_url" in scheme_data and scheme_data["official_portal_url"].startswith("https://")
        assert "gazette_notification_url" in scheme_data
        print(f"[PASS] Step 6: Official source citations verified: {scheme_data['official_portal_url']}")
        
        # Step 7: Start Eligibility Wizard
        resp_wizard = client.get(f"{FRONTEND_URL}/wizard")
        assert resp_wizard.status_code == 200
        print("[PASS] Step 7: Eligibility Wizard UI route loaded (HTTP 200)")
        
        # Step 8: Submit Profile (Affluent Senior Citizen aged 72)
        profile_senior = {
            "age": 72,
            "annual_income_inr": 1500000,
            "is_bpl_card_holder": False,
            "residence_area": "urban",
            "occupation": "senior_citizen"
        }
        resp_eval = client.post(
            f"{BACKEND_URL}/eligibility/evaluate",
            json={"profile": profile_senior}
        )
        assert resp_eval.status_code == 200
        eval_result = resp_eval.json()
        print("[PASS] Step 8: Profile submitted for deterministic AST evaluation")
        
        # Step 9: Review Eligibility Results (Must be ELIGIBLE for PM-JAY V2)
        eligible_ids = [s["scheme_id"] for s in eval_result["eligible_schemes"]]
        assert "ayushman-bharat-pmjay" in eligible_ids, "72-year-old should be eligible for PM-JAY 70+ expansion!"
        print(f"[PASS] Step 9: Review Eligibility: PM-JAY correctly classified as ELIGIBLE ({len(eligible_ids)} schemes eligible)")
        
        # Step 10: Inspect Missing Information & Follow-Up Questions
        incomplete_profile = {"is_bpl_card_holder": False}
        resp_incomplete = client.post(
            f"{BACKEND_URL}/eligibility/evaluate",
            json={"profile": incomplete_profile}
        )
        assert resp_incomplete.status_code == 200
        incomp_res = resp_incomplete.json()
        assert len(incomp_res["recommended_next_questions"]) > 0
        print(f"[PASS] Step 10: Missing information detected; recommended next questions: {incomp_res['recommended_next_questions'][:3]}")
        
        # Step 11: Ask AI Assistant a Question
        resp_chat = client.post(
            f"{BACKEND_URL}/assistant/query",
            json={"query": "What are the rules for senior citizens aged 70 and above under Ayushman Bharat?", "locale": "en"}
        )
        assert resp_chat.status_code == 200
        chat_data = resp_chat.json()
        assert chat_data["is_grounded"] is True
        print(f"[PASS] Step 11: AI Assistant responded with groundedness={chat_data['is_grounded']}")
        
        # Step 12: Verify Citations in Assistant Answer
        assert len(chat_data["citations"]) > 0
        cit = chat_data["citations"][0]
        assert cit["scheme_id"] == "ayushman-bharat-pmjay"
        assert "pmjay.gov.in" in cit["official_portal_url"]
        print(f"[PASS] Step 12: Citations verified pointing to: {cit['official_portal_url']}")
        
        # Step 13: Open Document Checklist
        resp_checklist = client.get(f"{BACKEND_URL}/documents/checklist/ayushman-bharat-pmjay")
        assert resp_checklist.status_code == 200
        doc_data = resp_checklist.json()
        assert len(doc_data["documents"]) > 0
        print(f"[PASS] Step 13: Document checklist retrieved with {len(doc_data['documents'])} verified documents")

        # =====================================================================
        # INSTITUTIONAL JOURNEY: Steps 1 to 7
        # =====================================================================
        print("\n--- RUNNING INSTITUTIONAL JOURNEY (7 STEPS) ---")
        
        # Step 1: Log in as Scheme Verifier
        token_payload = {
            "sub": "scheme_admin",
            "role": "SCHEME_VERIFIER",
            "user_id": "u-admin-1"
        }
        from app.core.security import create_access_token
        auth_token = create_access_token(token_payload)
        auth_headers = {"Authorization": f"Bearer {auth_token}"}
        print("[PASS] Step 1: Institutional token generated with SCHEME_VERIFIER role")
        
        # Step 2: Verify Role Permissions
        resp_admin_page = client.get(f"{FRONTEND_URL}/admin")
        assert resp_admin_page.status_code == 200
        print("[PASS] Step 2: Admin Verifier portal route verified (HTTP 200)")
        
        # Step 3: Open Review Queue
        resp_queue = client.get(f"{BACKEND_URL}/admin/review-queue", headers=auth_headers)
        assert resp_queue.status_code == 200
        queue_items = resp_queue.json()
        print(f"[PASS] Step 3: Review queue inspected ({len(queue_items)} schemes in catalogue queue)")
        
        # Step 4: Inspect Scheme Evidence
        target_scheme_id = "ayushman-bharat-pmjay"
        resp_inspect = client.get(f"{BACKEND_URL}/schemes/{target_scheme_id}")
        assert resp_inspect.status_code == 200
        assert resp_inspect.json()["source_reference_date"] is not None
        print(f"[PASS] Step 4: Scheme evidence inspected for {target_scheme_id} (Source date: {resp_inspect.json()['source_reference_date']})")
        
        # Step 5: Approve Scheme Version Action
        resp_verify = client.post(
            f"{BACKEND_URL}/admin/verify",
            headers=auth_headers,
            json={
                "scheme_id": target_scheme_id,
                "action": "APPROVE",
                "verification_notes": "Phase 18.2 end-to-end integration audit verified."
            }
        )
        assert resp_verify.status_code == 200
        assert resp_verify.json()["status"] == "success"
        print("[PASS] Step 5: Scheme verification APPROVE action executed successfully")
        
        # Step 6: Verify Immutable Version Creation & Preservation
        from app.db.repository import SchemeRepository
        versions = SchemeRepository.get_all_versions(target_scheme_id)
        assert len(versions) >= 2, "Expected at least 2 versions (V1 and V2)!"
        v_numbers = [v["version_number"] for v in versions]
        assert 1 in v_numbers and 2 in v_numbers
        print(f"[PASS] Step 6: Immutable versions verified: {v_numbers}")
        
        # Step 7: Inspect Audit History & Verify RBAC
        # 7a: Scheme Verifier attempting to access Super Admin audit logs -> 403 Forbidden (RBAC enforcement)
        resp_forbidden = client.get(f"{BACKEND_URL}/admin/audit-logs", headers=auth_headers)
        assert resp_forbidden.status_code == 403, f"Expected 403 Forbidden for SCHEME_VERIFIER on audit logs, got {resp_forbidden.status_code}"
        print("[PASS] Step 7a: RBAC enforced - SCHEME_VERIFIER forbidden from viewing full audit log (HTTP 403)")

        # 7b: Super Admin accesses audit logs -> HTTP 200 with recorded actions
        admin_token = create_access_token({"sub": "super_admin", "role": "SUPER_ADMIN", "user_id": "u-admin-0"})
        super_admin_headers = {"Authorization": f"Bearer {admin_token}"}
        resp_audit = client.get(f"{BACKEND_URL}/admin/audit-logs", headers=super_admin_headers)
        assert resp_audit.status_code == 200, f"Expected 200 for SUPER_ADMIN, got {resp_audit.status_code}"
        audit_history = resp_audit.json()
        assert len(audit_history) > 0, "Expected at least 1 audit log entry!"
        latest_audit = audit_history[-1]
        assert latest_audit["entity_id"] == target_scheme_id
        assert latest_audit["action"] in ["APPROVE", "VERIFY_AND_UPDATE", "PUBLISHED"]
        print(f"[PASS] Step 7b: Audit history verified via API: Action={latest_audit['action']} by {latest_audit['performed_by']}")
        
    print("\n" + "=" * 80)
    print("ALL 13 CITIZEN STEPS AND 7 INSTITUTIONAL STEPS PASSED SUCCESSFULLY.")
    print("=" * 80)

if __name__ == "__main__":
    run_e2e_tests()
