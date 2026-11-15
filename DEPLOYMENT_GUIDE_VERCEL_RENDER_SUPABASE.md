# SchemeSaathi Cloud Production Deployment Guide
**Target Architecture:** Vercel (Next.js Frontend) + Render (FastAPI Backend) + Supabase (PostgreSQL 16 with pgvector)  
**Cost:** 100% Free Tier Supported  
**SSL/HTTPS:** Automatic on all tiers  
**CI/CD:** Automatic deploy on `git push origin main`  

---

## Architecture Flow

```
[ Citizen Browser / CSC Kiosk ]
              │
              ▼ HTTPS
[ Vercel Edge Global CDN ]
  ├── Next.js 15 App Router (Trilingual UI: EN / HI / KN)
  └── Dynamic SSG / Client-side Hydration
              │
              ▼ REST API (HTTPS)
[ Render Web Service ]
  ├── FastAPI (Python 3.11)
  ├── Multilingual Hybrid Search (Vector + Lexical + RRF)
  ├── Deterministic JSONLogic AST Rule Evaluator
  ├── In-Memory Circuit Breaker (4.3 µs fast-fail fallback)
  └── Gemini 2.5 Flash-Lite LLM Integration
              │
              ▼ Direct / Pooled Connection (SSL)
[ Supabase Managed Database ]
  ├── PostgreSQL 16
  └── pgvector Extension (768-dimensional scheme embeddings)
```

---

## Step 1: Provision Free PostgreSQL + pgvector on Supabase (2 mins)

1. Go to **[https://supabase.com](https://supabase.com)** and sign in / create a free account.
2. Click **"New Project"**:
   - **Name:** `schemesaathi-db`
   - **Database Password:** Enter a strong password (save this!).
   - **Region:** Choose `South Asia (Mumbai)` for minimal latency in India.
3. Once the database is provisioned, go to **SQL Editor** in the left sidebar and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Go to **Project Settings** $\rightarrow$ **Database** $\rightarrow$ **Connection string**:
   - Select **URI** tab.
   - Copy the connection string. It looks like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```
   - For SchemeSaathi, you will use:
     - `DATABASE_URL_SYNC`: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
     - `DATABASE_URL`: `postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

---

## Step 2: Deploy Backend to Render (3 mins)

1. Go to **[https://render.com](https://render.com)** and sign in with GitHub.
2. Click **"New +"** $\rightarrow$ **"Web Service"**.
3. Connect your repository: `Sharan126/SchemeSaathi`.
4. Configure the Web Service:
   - **Name:** `schemesaathi-backend`
   - **Region:** `Singapore` (closest to India on free tier)
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command:** `alembic upgrade head && python -m app.db.init_db && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** `Free`
5. Click **"Advanced"** $\rightarrow$ **"Add Environment Variable"** and set:
   | Key | Value | Description |
   |:---|:---|:---|
   | `ENVIRONMENT` | `production` | Enables production validation guard |
   | `DATABASE_URL` | `postgresql+asyncpg://postgres:[PASSWORD]@...:5432/postgres` | Asyncpg connection to Supabase |
   | `DATABASE_URL_SYNC` | `postgresql://postgres:[PASSWORD]@...:5432/postgres` | Sync connection for Alembic migrations |
   | `SECRET_KEY` | *(Generate a 64-character random string)* | JWT encryption key |
   | `ALLOWED_ORIGINS` | `https://schemesaathi.vercel.app,http://localhost:3000` | CORS permissions for Vercel frontend |
   | `LLM_PROVIDER` | `gemini` | Grounded AI assistant provider |
   | `GEMINI_API_KEY` | `your_google_ai_studio_api_key_here` | Your Google AI Studio API key |
   | `GEMINI_MODEL` | `gemini-2.5-flash-lite` | Stable high-speed model |
   | `EMBEDDING_PROVIDER` | `deterministic-hash` | Zero-dependency Indic embeddings |
6. Click **"Create Web Service"**.
7. Render will build, run Alembic migrations (`2a724a716cfa`), seed all 8 verified schemes, and expose your live API URL:
   `https://schemesaathi-backend.onrender.com`

---

## Step 3: Deploy Frontend to Vercel (2 mins)

1. Go to **[https://vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **"Add New..."** $\rightarrow$ **"Project"**.
3. Import `Sharan126/SchemeSaathi`.
4. In **Project Settings**:
   - **Framework Preset:** `Next.js` (auto-detected).
   - **Root Directory:** Click "Edit" and select `frontend`.
5. Under **Environment Variables**, add:
   | Key | Value |
   |:---|:---|
   | `NEXT_PUBLIC_API_URL` | `https://schemesaathi-backend.onrender.com/api/v1` |
6. Click **"Deploy"**.
7. In ~60 seconds, Vercel will provide your global production domain:
   `https://schemesaathi.vercel.app` (or custom domain).

---

## Step 4: Verification & Smoke Test Checklist

Once deployed:
1. Open `https://schemesaathi.vercel.app`: verify trilingual toggles (English, Hindi, Kannada).
2. Visit `/schemes`: verify all 8 Central Government schemes load from Supabase.
3. Test `/wizard`: run the senior citizen profile (Age 72, urban) $\rightarrow$ verify Ayushman Bharat 70+ Vaya Vandana expansion appears as **Eligible**.
4. Test `/assistant`: ask *"What is the cash benefit under PMMVY for mothers?"* $\rightarrow$ verify grounded synthesis with official ministry citations.
