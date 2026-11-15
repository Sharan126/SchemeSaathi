# SECURITY AND PRIVACY AUDIT REPORT

**Audit Date:** 2026-11-15  
**Auditor:** Principal Security Engineer & Privacy Auditor  
**Scope:** Frontend state, Backend API layer, Data persistence, Authentication, RAG pipelines, and LLM integrations  
**Standards Evaluated:** Digital Personal Data Protection (DPDP) Act 2023, OWASP Top 10 (2021), OWASP Top 10 for LLM Applications (2023)  
**Status:** **PASS (ZERO-PII COMPLIANT, NO EVAL/EXEC, RBAC ENFORCED)**

---

## 1. Zero-PII Compliance Across Entire Data Flow

An exhaustive audit of the citizen data flow was conducted to verify the claim of **Zero-PII** operation:

| Layer Audited | Information Requested / Processed | Stored in Database? | Written to Server Logs? | Stored in Browser Storage? | DPDP 2023 Compliance |
|---|---|---|---|---|---|
| **Wizard Questionnaire** | Demographics: Age, Gender, State, Residence Area (`rural`/`urban`), Social Category (`GEN`, `SC`, `ST`, `OBC`, `EWS`). Livelihood: Occupation, Income bracket, BPL card indicator, Taxpayer indicator, Landholding. | **NO** | **NO** | **NO** (React in-memory `useState` only) | **COMPLIANT** |
| **Personal Identifiers** | Aadhaar Number, PAN Card Number, Voter ID, Phone Number, Email, Citizen Name, Home Address, Bank Account Number. | **NEVER COLLECTED** | **NEVER LOGGED** | **NEVER STORED** | **COMPLIANT** |
| **Eligibility API** | `CitizenProfileInput` received via `POST /api/v1/eligibility/evaluate`. | **NO** (Evaluated in memory, discarded immediately) | **NO** | N/A | **COMPLIANT** |
| **Grounded AI Assistant** | Query string and locale code. | **NO** | **NO** | Local session memory only | **COMPLIANT** |
| **Document Directory** | Read-only information on issuing authorities and procedures. | **NO** | **NO** | N/A | **COMPLIANT** |

**Auditor Finding:** The Zero-PII claim is fully verified. Citizens can determine their eligibility and generate document checklists anonymously without any risk of digital identity surveillance, data breaches, or profiling.

---

## 2. Authentication, JWT & Cryptographic Security

- **Password Hashing:** Passwords for institutional administrators and CSC operators are hashed using `bcrypt` via `passlib.context.CryptContext(schemes=["bcrypt"])` with standard work factor 12. Plaintext passwords are never stored or logged.
- **JWT Architecture:**
  - Standard RFC 7519 implementation using `python-jose`.
  - Signature Algorithm: Strictly enforced to `HS256` (`JWT_ALGORITHM = "HS256"`). The decoder rejects `none` or mismatched algorithms.
  - Token Lifespan: Access tokens expire after 60 minutes (`JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60`). Refresh token rotation configured for 7 days.
  - Role Claims: Stamped in JWT payload (`sub`, `role`, `user_id`, `exp`).

---

## 3. Role-Based Access Control (RBAC) Enforcement

The administrative API endpoints are protected using FastAPI dependency injection via `require_roles()`:

```python
def require_roles(*allowed_roles: str):
    async def role_checker(current_user: TokenData = Depends(require_authenticated_user)) -> TokenData:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User role '{current_user.role}' lacks permission for this action."
            )
        return current_user
    return role_checker
```

- Unauthenticated requests to `/admin/review-queue`, `/admin/verify`, or `/admin/audit-logs` return `HTTP 401 Unauthorized`.
- Authenticated requests with non-privileged roles (e.g., `CITIZEN_GUEST`, `NGO_WORKER`) return `HTTP 403 Forbidden`.
- Verified in `backend/tests/test_audit_journeys.py`.

---

## 4. Code & Injection Defenses

| Vulnerability Vector | Defense Mechanism | Audit Verification | Status |
|---|---|---|---|
| **Python Code Injection (`eval`/`exec`)** | Zero usage of `eval()`, `exec()`, `os.system()`, or `subprocess` in AST engine. | Strict allowlist: `ALLOWED_OPERATORS`. Disallowed operators throw `ValueError`. Verified in `test_allowlist_enforcement`. | **PASS** |
| **SQL Injection** | Parameterized queries via SQLAlchemy and Pydantic schema validation. In-memory repository uses Python dictionary indexing. | No raw string-concatenated SQL queries present in endpoints. | **PASS** |
| **Cross-Site Scripting (XSS)** | React 19 / Next.js automatic JSX escaping. External links use `rel="noopener noreferrer"`. | No usage of `dangerouslySetInnerHTML` in user-facing components. | **PASS** |
| **CORS Misconfiguration** | Restricted to trusted client origins via `ALLOWED_ORIGINS` setting (`http://localhost:3000,http://127.0.0.1:3000`). | Wildcard `*` is not used in production configuration. | **PASS** |
| **Prompt Injection (LLM01)** | AI assistant answers are generated from retrieved official chunks using deterministic template formatting or strictly bounded prompts. | Malicious instruction overrides tested in `test_rag_resilience_to_prompt_injection`. Sythesizer never leaks unauthorized benefits. | **PASS** |

---

## 5. Security Recommendations for Public Deployment

1. **Rotate Production Secret Key**: Replace development fallback `SECRET_KEY` in `.env` with a high-entropy 256-bit secret generated via `openssl rand -hex 32`.
2. **Reverse Proxy Rate Limiting**: Deploy Nginx or Cloudflare in front of `/api/v1/eligibility/evaluate` and `/api/v1/assistant/query` with rate limiting of 30 requests per minute per IP to mitigate Denial of Service (DoS).
3. **HTTPS Enforcement**: Ensure all traffic terminates via TLS 1.3 with HTTP Strict Transport Security (HSTS) headers enabled.
