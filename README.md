# JobPulse AI — Anakin Hackathon Project

A real-time job market intelligence platform with semantic search, RAG-powered chatbot, and skill trend analytics.

## Monorepo Structure

```
├── frontend/     # Next.js 16 — UI dashboard
├── backend/      # FastAPI — Python API server
└── .gitignore
```

## Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev        # → http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` in `frontend/.env` to point to the backend.

## Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Copy `backend/.env.example` → `backend/.env` and fill in your API keys.

## Deployment

Both apps are configured for **Vercel** deployment:
- **Frontend**: Deploy `frontend/` as a Next.js project
- **Backend**: Deploy `backend/` as a Python serverless project (uses `vercel.json`)
