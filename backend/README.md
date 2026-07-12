# JobPulse AI — FastAPI Backend (Python)

This is the **Python FastAPI equivalent** of the Next.js API routes. It provides the same endpoints using FastAPI + SQLAlchemy + sqlite-vec + sentence-transformers.

## Why this exists

The main project runs on Next.js 16 (TypeScript) because the hackathon environment requires it. This FastAPI version is provided as a **reference implementation** for teams that prefer a Python backend, or for production deployment where you want to separate the API from the frontend.

## Stack

- **Framework**: FastAPI 0.115
- **Database**: SQLAlchemy 2.0 + SQLite (relational) + sqlite-vec (vectors)
- **Embeddings**: sentence-transformers (all-MiniLM-L6-v2, 384-dim, offline)
- **LLM**: Google Gemini API (with fallback to z-ai-web-dev-sdk via HTTP)
- **Auth**: JWT tokens (PyJWT + passlib/bcrypt)
- **Validation**: Pydantic v2

## Setup

```bash
cd fastapi-backend/
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy .env from the parent project (same keys work)
cp ../.env .env

# Run the server
uvicorn main:app --reload --port 8000

# API docs at http://localhost:8000/docs
```

## Endpoints

All endpoints mirror the Next.js API routes:

| Endpoint | Method | Description |
|---|---|---|
| `/api/postings` | GET | Paginated, filterable job postings |
| `/api/postings/{id}` | GET | Single posting + similar jobs |
| `/api/matches` | GET | Semantic job matches for current user |
| `/api/search` | GET | Vector similarity search |
| `/api/chat` | POST | RAG chatbot (Gemini + vector search) |
| `/api/profile` | GET/PUT | User profile |
| `/api/resume` | GET/PUT | Resume builder data |
| `/api/saved-jobs` | GET/POST/DELETE | Saved jobs |
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Sign in (returns JWT) |
| `/api/auth/me` | GET | Current user |
| `/api/stats` | GET | Dashboard stats |
| `/api/vector-stats` | GET | Vector coverage |
| `/api/cron/ingest` | POST | Trigger ingestion (secret-protected) |

## Files

```
fastapi-backend/
├── main.py                 # FastAPI app + router includes
├── config.py               # Pydantic settings (loads .env)
├── database.py             # SQLAlchemy engine + session
├── models.py               # SQLAlchemy ORM models
├── schemas.py              # Pydantic request/response models
├── auth.py                 # JWT auth + password hashing
├── embedding.py            # sentence-transformers wrapper
├── vectordb.py             # sqlite-vec vector storage
├── vector_search.py        # Semantic search service
├── anakin.py               # Anakin API client
├── adzuna.py               # Adzuna API client
├── normalizer.py           # Region/salary/jobtype/skill extraction
├── ingestion.py            # Orchestration (fetch + embed + store)
├── matcher.py              # Weighted job matching
├── gemini.py               # Gemini LLM client
├── routers/
│   ├── postings.py
│   ├── matches.py
│   ├── chat.py
│   ├── search.py
│   ├── profile.py
│   ├── resume.py
│   ├── saved_jobs.py
│   ├── auth.py
│   ├── stats.py
│   └── cron.py
├── requirements.txt
└── .env.example
```

## Migration from Next.js

1. Run the FastAPI server on port 8000
2. Update the Next.js frontend's API base URL to `http://localhost:8000`
3. The frontend's `fetch("/api/...")` calls become `fetch("http://localhost:8000/api/...")`
4. Auth cookies are set by FastAPI instead of Next.js API routes

## Production Deployment

```bash
# Using gunicorn + uvicorn workers
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Or using Docker (see Dockerfile)
docker build -t jobpulse-api .
docker run -p 8000:8000 --env-file .env jobpulse-api
```
