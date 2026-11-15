# Privacy, Data Protection & Security Review — SchemeSaathi Phase 18.3
**Document Reference:** `PRIVACY_AND_SECURITY_REVIEW.md`  
**Governing Statute:** Digital Personal Data Protection Act, 2023 (DPDP Act 2023) & Aadhaar Act (Section 29)  
**Status:** COMPLIANT WITH ZERO-PII ARCHITECTURE  
**Evaluator Role:** Principal Security Auditor & Government Compliance Specialist  

---

## 1. Architectural Privacy Posture: Privacy-by-Design

SchemeSaathi operates as an informational and eligibility discovery platform for Central Government welfare schemes. It does not act as an enrollment registrar or disbursing entity. Consequently, its data architecture was designed from inception to adhere to the strictest data minimization principles:

### 1.1 Non-Collection of High-Risk PII
The system enforces a **Zero-PII Storage Policy** across all public interfaces (Home, Explore Schemes, Eligibility Wizard, AI Assistant):

| Data Type / Credential | Platform Stance | Verification Evidence |
|:---|:---:|:---|
| **Aadhaar Number (12 digits)** | **NEVER COLLECTED** | Zero schema fields; regex reject on AI chat input; no UIDAI auth tokens. |
| **Aadhaar Biometrics / VID** | **NEVER COLLECTED** | No biometric capture drivers or API hooks. |
| **Bank Account / IFSC** | **NEVER COLLECTED** | Benefits are explained; banking details are neither requested nor saved. |
| **Permanent Account Number (PAN)** | **NEVER COLLECTED** | Tax-payer status is evaluated as a boolean (`has_paid_income_tax`). |
| **Full Legal Name** | **OPTIONAL / ANONYMOUS** | Guest citizens interact anonymously without registration. |
| **Exact Residential Address** | **COARSE-GRAINED ONLY** | Only State (`state`) and Settlement Type (`rural` / `urban`) are evaluated. |
| **Citizen Phone Number** | **NEVER COLLECTED** | No SMS OTP gateway requirements for basic eligibility discovery. |

---

## 2. DPDP Act 2023 Statutory Compliance Audit

The application was audited against the key mandates of the Digital Personal Data Protection Act, 2023 (DPDP Act):

### 2.1 Purpose Limitation (Section 4)
- **Evaluation:** Data entered into the Eligibility Wizard (`age`, `income`, `caste_category`, `landholding`) is used **exclusively** in-memory to compute the deterministic AST eligibility tree for that specific interactive turn.
- **Finding:** Citizen profile inputs are NOT persisted in the database. `EligibilityService.evaluate_profile()` processes ephemeral request payloads and returns the calculated response without writing citizen demographic records to disk.

### 2.2 Notice and Consent (Section 5 & 6)
- **Evaluation:** The frontend header and wizard display clear, multilingual statutory notices indicating that SchemeSaathi is an independent informational tool and does not replace official ministry portal enrollment.
- **Finding:** Citizens are not coerced into consenting to marketing, tracking, or data-sharing. No third-party tracking scripts (Google Analytics, Facebook Pixel, ad networks) exist in the repository.

### 2.3 Data Minimization (Section 6(1))
- **Evaluation:** In the AI Assistant, citizen queries are stripped of prompt injections and evaluated solely against retrieved statutory chunks.
- **Finding:** The Gemini API client payload sends ONLY the user's conversational text query and the retrieved official scheme chunks. No citizen demographic profiles, IP addresses, or browser fingerprints are transmitted to Google AI Studio.

### 2.4 Data Principal Rights (Sections 11–14)
- **Right to Access / Correction / Erasure:** Because citizen queries and eligibility profiles are ephemeral and not saved into user accounts, there is zero persistent citizen data to erase or rectify.
- **Grievance Redressal:** The portal provides direct links to the relevant Central Ministry Grievance Portals (CPGRAMS, PM-KISAN Helpdesk, NHA Grievance Portal).

---

## 3. Network Security & API Payload Sanitization

### 3.1 External LLM Gateway Security
1. **API Key Sequestration:** The Gemini API key is loaded strictly via environment variables (`GEMINI_API_KEY` in `.env`), with fallback to system environment variables.
2. **Key Masking:** Log outputs mask the active key (`AIzaSy...XYZ`), ensuring API secrets never leak into stdout, task logs, or error traces.
3. **Data Exfiltration Interception:** The prompt template strictly instructs the LLM:
   - *"Do not ask the citizen for their Aadhaar number, bank credentials, or passwords."*
   - *"If a user shares sensitive personal credentials, advise them to keep them confidential."*

### 3.2 Audit Trail Immutability (Administrative Events Only)
The `audit_logs` table records purely administrative and verification lifecycle events:
- Schema: `id`, `entity_type`, `entity_id`, `action`, `performed_by`, `timestamp`, `changes`, `comment`.
- Captured Actions: `CREATED`, `REVIEWED`, `VERIFIED`, `PUBLISHED` for scheme seed data.
- **Privacy Assurance:** Citizen eligibility wizard evaluations and AI chat messages are **never written** to `audit_logs`. The audit trail is reserved strictly for scheme governance accountability.

---

## 4. Authentication and Role-Based Access Control (RBAC)

### 4.1 Threat Modeling
- **Super Admin (`SUPER_ADMIN`):** Can create and edit scheme definitions.
- **Scheme Verifier (`SCHEME_VERIFIER`):** Can review and publish new scheme versions.
- **CSC Operator (`CSC_OPERATOR`):** Can access assisted application checklists for rural citizens.
- **Guest Citizen (`CITIZEN_GUEST`):** Read-only access to published schemes, eligibility wizard, and AI chat.

### 4.2 Cryptographic Rigor
- Passwords are encrypted using **bcrypt** with salted hashes via `passlib.context.CryptContext`.
- JWT access tokens use **HS256** with configurable expiration (`JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 1440`).
- Unauthenticated citizens are safely handled via `get_current_user_optional()`, guaranteeing that guest citizens can discover benefits without needing to register or surrender credentials.

---

## 5. Security Recommendations for Pilot
1. **HTTPS Enforcement:** Before public domain DNS cutover, configure reverse proxy (Nginx or Cloudflare) with HSTS (`Strict-Transport-Security: max-age=31536000; includeSubDomains`).
2. **CORS Hardening:** In production mode, restrict `ALLOWED_HOSTS` and CORS origins strictly to the pilot domain (e.g. `https://schemesaathi.in`).
3. **Rate Limiting:** Enable Redis/SlowAPI IP-level rate limiting (e.g., 60 requests/minute per IP) on `/api/v1/assistant/chat` to protect against denial-of-service and API quota exhaustion.
