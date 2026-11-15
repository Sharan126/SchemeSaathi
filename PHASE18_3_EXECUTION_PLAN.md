# SchemeSaathi Phase 18.3 — Production Hardening & Citizen Pilot Readiness Execution Plan

**Evaluation Date:** 2026-11-16  
**Author Roles:** Principal Software Architect, Senior QA Engineer, RAG Specialist, Database Engineer, Security Auditor & Smart India Hackathon Technical Evaluator  
**Status:** **ACTIVE EXECUTION PLAN**  
**Repository Baseline:**
- **Frontend:** Next.js 15.2.1 + React 19 (`http://localhost:3000`)
- **Backend:** FastAPI 0.115.0 + Uvicorn (`http://localhost:8001/api/v1`)
- **Staging Persistence:** SQLite 3 Physical Storage (`schemesaathi.db`, 260 KB)
- **Active Tests:** 49/49 Passing Backend Tests
- **Active Gemini Key:** Verified on Google AI Studio REST API

---

## 1. Baseline Verification & Audit Objectives

Phase 18.2 proved the deterministic AST eligibility engine, trilingual catalog, and live Google Gemini API integration. However, to prepare SchemeSaathi for a controlled citizen pilot with real users (rural farmers, pregnant mothers, students, senior citizens, and CSC operators), critical hardening must be enacted:

1. **Database Runtime:** Verify PostgreSQL 16 + pgvector readiness, author missing Alembic migrations, enforce anti-SQLite production guards, test transaction rollbacks, and implement database backup/restore mechanisms.
2. **Multilingual Retrieval:** Remediate the 50% cross-lingual (Hindi $\to$ English) Recall@5 bottleneck using translated-query expansion and bidirectional administrative glossary indexing to achieve $\ge 90\%$ Recall@5 without GPU overhead.
3. **Gemini Reliability & Latency:** Incorporate `thinkingConfig: {"thinkingBudget": 0}` to drop Gemini latency from ~21s to ~2.1s, benchmark `gemini-3.8-flash` vs `gemini-3.5-flash` vs `gemini-2.5-flash-lite`, and implement an in-memory circuit-breaker.
4. **AI Safety & Grounding:** Stress-test against 15+ adversarial, ambiguous, outdated, and non-existent scheme scenarios, enforcing strict non-overridable deterministic eligibility.
5. **Security & DPDP Review:** Perform a full data-flow audit ensuring zero personal identifier leakage, no raw Aadhaar collection, and strict RBAC isolation.
6. **Statutory Scheme Evidence:** Recheck all 8 central schemes against latest Gazette notifications and official ministry guidelines.
7. **Citizen Pilot Readiness:** Prepare end-to-end usability walkthroughs for 6 citizen archetypes and determine final pilot release verdict.

---

## 2. Deliverables Checklist & Task Mapping

| Deliverable ID | Document Name | Target Task | Status |
|:---:|:---|:---:|:---:|
| **DEL-01** | `PHASE18_3_EXECUTION_PLAN.md` | Baseline Roadmap | **IN PROGRESS** |
| **DEL-02** | `POSTGRESQL_PRODUCTION_VALIDATION.md` | Task 1: PostgreSQL & Alembic | **PENDING** |
| **DEL-03** | `MULTILINGUAL_RETRIEVAL_REMEDIATION.md` | Task 2: Multilingual 90%+ Recall | **PENDING** |
| **DEL-04** | `GEMINI_MODEL_COMPARISON.md` | Task 3: Gemini 3.8 / 3.5 / 2.5-Lite | **PENDING** |
| **DEL-05** | `AI_QUALITY_AND_SAFETY_REPORT.md` | Task 4: Safety & Adversarial Testing | **PENDING** |
| **DEL-06** | `PERFORMANCE_AND_RESILIENCE_REPORT.md` | Task 5: Latency P50/P95/P99 & Resilience | **PENDING** |
| **DEL-07** | `PRIVACY_AND_SECURITY_REVIEW.md` | Task 6: DPDP & Data-Flow Audit | **PENDING** |
| **DEL-08** | `SCHEME_EVIDENCE_VERIFICATION_MATRIX.md` | Task 7: Official Scheme Verification | **PENDING** |
| **DEL-09** | `CITIZEN_PILOT_READINESS_REPORT.md` | Task 8: 6-Persona Citizen Pilot Protocol | **PENDING** |
| **DEL-10** | `PHASE18_3_FINAL_EVALUATOR_VERDICT.md` | Task 9: Final Release Verdict & 9 Q&A | **PENDING** |

---

## 3. Strict Execution Protocol

- **Fact-Based Evidence:** Every latency, recall number, and API status must be derived from executed scripts.
- **Honest Status Classification:** Clearly classify findings as:
  - `FIXED AND VERIFIED`
  - `FIXED BUT NOT FULLY VERIFIED`
  - `NOT FIXED`
  - `BLOCKED` (e.g. host-level Docker daemon constraints)
  - `REQUIRES HUMAN REVIEW`
- **Zero Regression:** All existing 49 backend pytest tests and 20 E2E integration steps must continue passing.
