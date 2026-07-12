# JobPulse AI — Real-Time Job Market Intelligence

Built for the **Anakin Hackathon**. A full-stack job market intelligence platform that scrapes 6,000+ real job postings via the Anakin API (4dayweek.io) + Adzuna API, generates local embeddings for semantic search, and powers a RAG chatbot that answers natural-language questions about the job market.

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Copy .env.example to .env and fill in your keys
cp .env.example .env

# 3. Push the database schema
bun run db:push

# 4. Run ingestion (fetches 6K+ jobs + generates embeddings)
node scripts/scale-adzuna.js    # Adzuna (5,800 India jobs)
# Anakin (4dayweek.io) jobs are fetched via the cron endpoint:
curl "http://localhost:3000/api/cron/ingest?secret=jobpulse-cron-secret-2026&adzuna=false"

# 5. Start the dev server
bun run dev
# Open http://localhost:3000
```

## Demo Account
- Email: `demo@jobpulse.ai`
- Password: `demo123456`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 Frontend                       │
│  Dashboard │ Matches │ Resume Builder │ Chat Widget          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Next.js API Routes (TypeScript)                 │
│  /api/postings  /api/matches  /api/chat  /api/search         │
│  /api/profile   /api/resume   /api/saved-jobs  /api/auth/*   │
│  /api/stats     /api/vector-stats  /api/cron/ingest          │
└────────┬────────────────┬────────────────┬──────────────────┘
         │                │                │
┌────────▼───────┐ ┌──────▼───────┐ ┌──────▼──────────────────┐
│  Prisma +      │ │ better-sqlite3│ │ z-ai-web-dev-sdk        │
│  SQLite        │ │ + sqlite-vec  │ │ (GLM-4.6 LLM)           │
│  (relational)  │ │ (vectors)     │ │                         │
│  6,187 jobs    │ │ 6,187 vectors │ │ Chat + RAG              │
└────────────────┘ └───────────────┘ └─────────────────────────┘
         │                │
         │    ┌───────────┘
         │    │
┌────────▼────▼───────────────────────────────────────────────┐
│        @xenova/transformers (all-MiniLM-L6-v2)              │
│        384-dim embeddings, runs ON-DEVICE (no API)          │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. Live Job Market Dashboard
- Split-flap ticker showing in-demand skills
- Salary heatmap by region × role family
- Skill trend lists (most in-demand + emerging)
- Filterable, paginated postings table (6,187 jobs)
- Filters: category, region, role family, work mode, **job type** (full-time/part-time/intern/contract), skill

### 2. Semantic Job Matching
- Weighted multi-signal scorer: skills overlap (40%), role family (25%), region (15%), remote type (10%), salary (10%)
- Personalized match scores with explainable reasoning
- Per-signal breakdown bars

### 3. RAG-Powered Chatbot
- **Intent detection**: detects when a query needs semantic search
- **Vector search (RAG)**: embeds query + user profile → searches 6K vectors → injects results into LLM context
- **Safety guards**: regex pre-filter blocks destructive intent (delete/drop/truncate)
- Example: "how many jobs in Bangalore suit me?" → searches vectors, returns "15 matches at Jai Kisan, ValueLabs, ..."

### 4. Resume Builder
- 3 templates: Modern (sidebar), Classic (centered serif), Minimalist (grid)
- Live preview, auto-save, PDF download via `window.print()`

### 5. User System
- Signup/login with scrypt-hashed passwords
- Profile: skills, target role, preferred regions, salary expectation
- Saved jobs (star any posting)
- Chat history persisted per user

## Data Sources

| Source | API | Jobs | Coverage |
|---|---|---|---|
| 4dayweek.io | Anakin API (`act_4dayweek_io_category_job_listing`) | 370 | 9 categories, global, 4-day workweek |
| Adzuna | Adzuna Jobs API | 5,817 | 30 roles × 10 India cities, full-time/intern/contract |
| **Total** | | **6,187** | 29 regions, 100% have embeddings |

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Database**: Prisma ORM + SQLite (relational) + better-sqlite3 + sqlite-vec (vectors)
- **Embeddings**: @xenova/transformers + all-MiniLM-L6-v2 (384-dim, offline, 23MB)
- **LLM**: z-ai-web-dev-sdk (GLM-4.6) — Gemini API key also supported via .env
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Auth**: Custom HMAC-signed cookie sessions (scrypt password hashing)

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/postings` | GET | Paginated, filterable job postings |
| `/api/postings/detail` | GET | Single posting + similar jobs |
| `/api/matches` | GET | Semantic job matches for current user |
| `/api/search` | GET | Vector similarity search (`?q=react+frontend`) |
| `/api/chat` | POST | RAG chatbot (intent detection + vector search + LLM) |
| `/api/chat/history` | GET | Chat history for current user |
| `/api/profile` | GET/PUT | User profile (skills, preferences) |
| `/api/resume` | GET/PUT | Resume builder data (auto-save) |
| `/api/saved-jobs` | GET/POST/DELETE | Save/unsave jobs |
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Sign in |
| `/api/auth/logout` | POST | Sign out |
| `/api/auth/me` | GET | Current user + saved count |
| `/api/stats` | GET | Dashboard stats (totals, breakdowns) |
| `/api/vector-stats` | GET | Vector coverage stats |
| `/api/ticker` | GET | Top skill signals for ticker |
| `/api/trends/skills` | GET | Rising + falling skills |
| `/api/trends/salary-heatmap` | GET | Salary medians by region × role |
| `/api/cron/ingest` | GET/POST | Trigger ingestion (secret-protected) |

## Cron Setup (Production)

Schedule an external cron to hit the ingestion endpoint every 6 hours:

```
GET https://<your-host>/api/cron/ingest?secret=<CRON_SECRET>
```

Or run the standalone script:
```bash
node scripts/scale-adzuna.js           # full Adzuna ingestion
node scripts/ingest-standalone.js      # Anakin + Adzuna + embeddings
node scripts/ingest-standalone.js --embed-only   # just embed existing postings
```

## Environment Variables

See `.env.example`:
- `DATABASE_URL` — SQLite file path
- `ANAKIN_API_KEY` — for 4dayweek.io scraping
- `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` — for India job scraping
- `GEMINI_API_KEY` — LLM for chatbot (optional, falls back to z-ai-web-dev-sdk)
- `CRON_SECRET` — protects the ingestion endpoint
- `NEXTAUTH_SECRET` — signs session cookies

## Files of Note

```
prisma/schema.prisma          # Posting, User, SavedJob, ChatMessage, SkillTrend, SalaryByRegion
src/lib/
  ├── anakin.ts               # Anakin API client (async task polling)
  ├── adzuna.ts               # Adzuna API client (retry + backoff)
  ├── normalizer.ts           # Canonicalize regions, parse salaries, derive job type, extract skills
  ├── ingestion.ts            # Orchestrates fetch + normalize + dedup + embed
  ├── aggregation.ts          # Weekly skill trends + salary heatmap
  ├── embedding.ts            # Xenova all-MiniLM-L6-v2 wrapper (384-dim, offline)
  ├── vectordb.ts             # better-sqlite3 + sqlite-vec virtual table
  ├── vector-search.ts        # Semantic search service
  ├── matcher.ts              # Weighted multi-signal job matching
  ├── session.ts              # HMAC-signed cookie sessions
  └── password.ts             # scrypt password hashing
src/app/api/                  # 20+ API routes
src/components/jobpulse/      # 12 React components
scripts/
  ├── scale-adzuna.js         # Standalone Adzuna ingestion (5K+ jobs)
  └── ingest-standalone.js    # Full ingestion (Anakin + Adzuna + embeddings)
```
