# SchemeSaathi (योजना साथी / ಯೋಜನೆ ಸಾಥಿ)

> A production-oriented multilingual government scheme discovery and eligibility assistance platform for India.

---

## 1. Project Overview

**SchemeSaathi** empowers Indian citizens—especially farmers, women, students, senior citizens, persons with disabilities, and rural residents—to discover relevant Central Government welfare schemes, understand their rights and benefits, determine eligibility deterministically, and prepare required documentation.

It also serves institutional users including NGOs, Common Service Centre (CSC) operators, and government information administrators through a verified backoffice workflow.

### Core Product Principles

1. **Correctness Before Catalogue Size**: We prioritize 100% verified, accurate scheme definitions over scraping vast numbers of unverified records.
2. **Official Sources First**: Every scheme record cites official gazette notifications, ministry portals, or government guidelines with source URLs and dates.
3. **Deterministic Eligibility Evaluation**: Eligibility logic is executed using a verified, deterministic Abstract Syntax Tree (AST) evaluator—**never** an LLM and **never** Python's `eval()`.
4. **Grounded AI with Citations**: AI conversational assistance is strictly grounded in verified retrieved text chunks, accompanied by exact paragraph/section citations.
5. **Human-in-the-Loop Verification**: Discovered schemes move through a formal lifecycle: `discovered` → `extracted` → `in_review` → `verified` → `published`.
6. **Privacy-First Design**: Citizens can discover schemes and evaluate eligibility completely anonymously. No Aadhaar, PAN, or sensitive PII is required or stored.
7. **Mobile-First & Multilingual**: Built for low-bandwidth mobile devices with native support for **English**, **Hindi (हिन्दी)**, and **Kannada (ಕನ್ನಡ)**.

---

## 2. Architecture Overview

SchemeSaathi is structured as a **modular monolith** with clean module boundaries:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend (App Router)                   │
│   - Citizen Portal (Mobile-First, i18n: EN/HI/KN, Anonymous Wizard)    │
│   - Institutional / Admin Backoffice (Scheme review & verification)    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ REST / JSON
┌────────────────────────────────────▼───────────────────────────────────┐
│                     FastAPI Modular Monolith Core                      │
│                                                                        │
│  ┌──────────────────────────┐         ┌─────────────────────────────┐  │
│  │   Scheme Catalogue       │         │    Deterministic Engine     │  │
│  │   - Versioned models     │         │    - JSONLogic / AST Eval   │  │
│  │   - Audit provenance     │         │    - Zero eval(), zero LLM  │  │
│  └──────────────────────────┘         └─────────────────────────────┘  │
│  ┌──────────────────────────┐         ┌─────────────────────────────┐  │
│  │   Hybrid Search & RAG    │         │    Multilingual Engine      │  │
│  │   - pgvector + tsvector  │         │    - EN / HI / KN catalogs  │  │
│  │   - Grounded LLM adapter │         │    - Terminology glossary   │  │
│  └──────────────────────────┘         └─────────────────────────────┘  │
│  ┌──────────────────────────┐         ┌─────────────────────────────┐  │
│  │   Document & Readiness   │         │    Ingestion & Pipeline     │  │
│  │   - Criteria checklists  │         │    - Discover -> Verify flow│  │
│  │   - Issuing authority dir│         │    - Official PDF parser    │  │
│  └──────────────────────────┘         └─────────────────────────────┘  │
│  ┌──────────────────────────┐         ┌─────────────────────────────┐  │
│  │   Auth & RBAC            │         │    Audit & Monitoring       │  │
│  │   - Admin/CSC Operator   │         │    - Immutable trail        │  │
│  └──────────────────────────┘         └─────────────────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│              PostgreSQL 16+ with pgvector Extension                    │
│   - Relational Tables: schemes, criteria, rules, documents, audit      │
│   - Vector Embeddings: scheme chunk embeddings (HNSW index)            │
│   - Full-Text Search: tsvector with Hindi/English text search config   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Layout

```
SchemeSaathi/
├── frontend/                  # Next.js 15+ App Router application
│   ├── src/
│   │   ├── app/               # Routes: /[locale]/(citizen)/..., /admin/...
│   │   ├── components/        # Reusable accessible UI components (Tailwind)
│   │   ├── messages/          # Static i18n catalogs (en.json, hi.json, kn.json)
│   │   ├── lib/               # API clients, state stores, eligibility helpers
│   │   └── types/             # Shared TypeScript interfaces
│   ├── package.json
│   └── tailwind.config.ts
├── backend/                   # Python FastAPI application
│   ├── app/
│   │   ├── api/v1/            # API endpoints grouped by domain
│   │   ├── core/              # Config, security, database session, exceptions
│   │   ├── modules/           # Domain modules
│   │   │   ├── catalogue/     # Scheme data models, lifecycle, versioning
│   │   │   ├── ingestion/     # Official source parsers, extraction pipelines
│   │   │   ├── eligibility/   # Deterministic AST rule evaluator & explainer
│   │   │   ├── rag/           # Hybrid vector search, grounding, LLM adapters
│   │   │   ├── translation/   # Multilingual services and glossary handlers
│   │   │   ├── readiness/     # Document requirements & application steps
│   │   │   ├── admin/         # Workflow approval & verification gates
│   │   │   ├── auth/          # JWT, API keys, RBAC (citizen is anonymous)
│   │   │   └── audit/         # Tamper-evident activity logs
│   │   ├── db/                # Base model, pgvector extensions, session
│   │   └── main.py            # FastAPI application factory
│   ├── alembic/               # Database migration scripts
│   ├── tests/                 # Unit, integration, and rule engine benchmarks
│   ├── pyproject.toml         # Dependencies managed via uv
│   └── alembic.ini
├── data/
│   ├── seeds/                 # Curated, verified Central Government schemes
│   └── taxonomies/            # Ministry, sector, beneficiary categories
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml     # PostgreSQL + pgvector + MinIO / Local stack
├── docs/                      # Architectural Decision Records (ADRs) & API specs
├── .env.example               # Reference environment variables
└── README.md
```

---

## 4. Getting Started & Development Instructions

### Prerequisites
- **Node.js**: v20+ (v24 LTS installed)
- **Python**: 3.11+ (Managed via `uv`)
- **Docker & Docker Compose**: For local PostgreSQL with `pgvector`

### 1. Clone & Setup Environment
```powershell
# Copy environment template
cp .env.example .env
```

### 2. Start PostgreSQL with pgvector
```powershell
docker compose -f docker/docker-compose.yml up -d db
```

### 3. Backend Setup (using uv)
```powershell
cd backend
# Create virtual environment with Python 3.11
uv venv --python 3.11
.venv\Scripts\activate

# Install dependencies
uv pip install -e ".[dev]"

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```

Visit:
- Citizen Portal: `http://localhost:3000`
- API Docs (Swagger): `http://localhost:8000/docs`

---

## 5. Critical Engineering Guardrails

- **Zero `eval()`**: Never evaluate stringified Python expressions. All rules are parsed into an Abstract Syntax Tree with strictly validated operator allowlists.
- **Never rely on LLM for eligibility**: An LLM may summarize eligibility criteria in plain language, but the qualification verdict is computed 100% deterministically by the rule engine.
- **Version Immobility**: Scheme rules and benefit levels are versioned immutably. If a ministry revises landholding limits or income caps, a new version is created with effective start/end timestamps.
- **Zero Fabricated Data**: Ingestion pipelines strictly store provenance (PDF hash, source URL, scraping timestamp, human reviewer ID).
