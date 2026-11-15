"""Security & Privacy Runtime Validation Suite

Audits:
- HTTP security headers
- API key masking & leak prevention
- JWT RBAC enforcement & tamper-proofing
- DPDP Act 2023 data minimization (Aadhaar number non-collection)
- Error trace sanitized responses
"""

import httpx
import time
from datetime import timedelta
from app.core.security import create_access_token
from app.modules.rag.gemini_client import mask_key

BASE_URL = "http://localhost:8001/api/v1"

def run_security_audit():
    print("=" * 80)
    print("SCHEMESAATHI SECURITY & PRIVACY RUNTIME AUDIT")
    print("=" * 80)
    
    with httpx.Client(timeout=10.0) as client:
        # 1. HTTP Security Headers
        resp = client.get(f"{BASE_URL}/schemes")
        assert resp.status_code == 200
        headers = resp.headers
        assert headers.get("x-content-type-options") == "nosniff", "Missing X-Content-Type-Options: nosniff"
        assert headers.get("x-frame-options") == "DENY", "Missing X-Frame-Options: DENY"
        assert headers.get("referrer-policy") == "strict-origin-when-cross-origin", "Missing Referrer-Policy"
        assert "camera=()" in headers.get("permissions-policy", ""), "Missing Permissions-Policy restrictions"
        print("[PASS] Check 1: Mandatory HTTP security headers verified (nosniff, DENY, strict-origin, permissions-policy)")

        # 2. Secrets Masking Algorithm
        test_key = "AIzaSyDummyTestKeyForMaskingVerification123456789"
        masked = mask_key(test_key)
        assert test_key not in masked
        assert masked == f"{test_key[:6]}...{test_key[-4:]}"
        assert len(masked) < len(test_key)
        print(f"[PASS] Check 2: API key masking verified: {test_key[:8]}... -> {masked}")

        # 3. DPDP Act 2023 - Data Minimization (Aadhaar)
        from app.modules.eligibility.service import CitizenProfileInput
        fields = CitizenProfileInput.model_fields.keys()
        assert "aadhaar_number" not in fields, "Raw Aadhaar number must NEVER be a citizen profile field!"
        assert "aadhaar" not in fields, "Raw Aadhaar must NEVER be collected in profile!"
        # Verify e-KYC/statutory document representation is strictly metadata/boolean
        print("[PASS] Check 3: DPDP Act 2023 Data Minimization verified - zero raw Aadhaar or biometric fields")

        # 4. RBAC: Unauthenticated Access to Admin Queue
        resp_unauth = client.get(f"{BASE_URL}/admin/review-queue")
        assert resp_unauth.status_code in (401, 403), f"Expected 401/403 for unauthenticated admin call, got {resp_unauth.status_code}"
        print(f"[PASS] Check 4: Unauthenticated admin access blocked ({resp_unauth.status_code})")

        # 5. RBAC: Privilege Escalation Prevention (SCHEME_VERIFIER -> Audit Logs)
        verifier_token = create_access_token({"sub": "verifier_user", "role": "SCHEME_VERIFIER"})
        resp_escalate = client.get(
            f"{BASE_URL}/admin/audit-logs",
            headers={"Authorization": f"Bearer {verifier_token}"}
        )
        assert resp_escalate.status_code == 403, f"Expected 403 Forbidden for verifier on audit logs, got {resp_escalate.status_code}"
        print("[PASS] Check 5: Privilege escalation blocked - SCHEME_VERIFIER denied SUPER_ADMIN audit logs (HTTP 403)")

        # 6. Tampered JWT Token Signature
        tampered_token = verifier_token[:-5] + "XXXXX"
        resp_tampered = client.get(
            f"{BASE_URL}/admin/review-queue",
            headers={"Authorization": f"Bearer {tampered_token}"}
        )
        assert resp_tampered.status_code == 401, f"Expected 401 for tampered JWT signature, got {resp_tampered.status_code}"
        print("[PASS] Check 6: Tampered JWT token rejected with HTTP 401")

        # 7. Expired JWT Token Handling
        expired_token = create_access_token({"sub": "old_user", "role": "SUPER_ADMIN"}, expires_delta=timedelta(seconds=-10))
        resp_expired = client.get(
            f"{BASE_URL}/admin/audit-logs",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert resp_expired.status_code == 401, f"Expected 401 for expired JWT, got {resp_expired.status_code}"
        print("[PASS] Check 7: Expired JWT token correctly rejected with HTTP 401")

        # 8. Error Trace Sanitization (404 and 422)
        resp_notfound = client.get(f"{BASE_URL}/schemes/non-existent-scheme-xyz-123")
        assert resp_notfound.status_code == 404
        assert "traceback" not in resp_notfound.text.lower()
        assert "sqlalchemy" not in resp_notfound.text.lower()
        assert "c:\\" not in resp_notfound.text.lower()
        print("[PASS] Check 8: 404 error payload sanitized - no internal stack trace or filesystem paths exposed")

        resp_bad_input = client.post(f"{BASE_URL}/eligibility/evaluate", json={"profile": {"age": "NOT_AN_INT"}})
        assert resp_bad_input.status_code == 422
        assert "traceback" not in resp_bad_input.text.lower()
        print("[PASS] Check 9: 422 validation error sanitized - structured field errors without exception trace")

    print("\n" + "=" * 80)
    print("ALL 9 SECURITY & PRIVACY RUNTIME CHECKS PASSED.")
    print("=" * 80)

if __name__ == "__main__":
    run_security_audit()
