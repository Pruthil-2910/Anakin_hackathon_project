"""
FastAPI app entry point — JobPulse AI backend.
Run: uvicorn main:app --reload --port 8000
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import (
    postings, matches, chat, search, profile, resume,
    saved_jobs, auth, stats, cron, trends, ticker,
)


def run_bg_ingestion():
    import asyncio
    from ingestion import run_ingestion
    # Create a new event loop for the background thread
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        print("🌱 Background seeding of SQLite database started...")
        loop.run_until_complete(
            run_ingestion(
                categories=None,
                max_pages_per_category=1,
                include_adzuna=False,
                skip_embeddings=False
            )
        )
        print("🌱 Background seeding complete!")
    except Exception as e:
        print(f"⚠️ Background seeding failed: {e}")
    finally:
        loop.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup + shutdown events."""
    print("🚀 JobPulse AI backend starting...")
    # Startup: ensure database tables are created
    try:
        from database import Base, engine
        import models  # registers models with Base
        import os
        
        # Auto-create db folder if local SQLite is used
        if settings.database_url.startswith("sqlite:///."):
            db_path_part = settings.database_url.replace("sqlite:///.", "./")
            db_dir = os.path.dirname(db_path_part)
            if db_dir and not os.path.exists(db_dir):
                os.makedirs(db_dir, exist_ok=True)
                
        # Auto-create vector db folder if local SQLite path is used
        if settings.vector_db_path.startswith("./"):
            vec_dir = os.path.dirname(settings.vector_db_path)
            if vec_dir and not os.path.exists(vec_dir):
                os.makedirs(vec_dir, exist_ok=True)

        Base.metadata.create_all(bind=engine)
        print("✅ Database tables verified/created")

        # Auto-seed database in background if empty (both local and Vercel SQLite environments)
        from database import SessionLocal
        from models import Posting
        db = SessionLocal()
        try:
            count = db.query(Posting).count()
            if count == 0:
                import threading
                threading.Thread(target=run_bg_ingestion, daemon=True).start()
        except Exception as se:
            print(f"⚠️ Check for empty db failed: {se}")
        finally:
            db.close()
    except Exception as e:
        print(f"⚠️  Database table creation failed: {e}")

    # Startup: warm up the embedding model
    try:
        from embedding import get_embedder
        get_embedder()  # Pre-load the model
        print("✅ Embedding model loaded")
    except Exception as e:
        print(f"⚠️  Embedding model not loaded: {e}")
    yield
    print("👋 JobPulse AI backend shutting down...")


app = FastAPI(
    title="JobPulse AI API",
    description="Real-time job market intelligence with semantic search + RAG chatbot",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://frontend-blue-one-64.vercel.app",
    ],
    allow_origin_regex="https://.*\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(postings.router, prefix="/api/postings", tags=["postings"])
app.include_router(matches.router, prefix="/api/matches", tags=["matches"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(saved_jobs.router, prefix="/api/saved-jobs", tags=["saved-jobs"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(trends.router, prefix="/api/trends", tags=["trends"])
app.include_router(ticker.router, prefix="/api/ticker", tags=["ticker"])
app.include_router(cron.router, prefix="/api/cron", tags=["cron"])


@app.get("/api/health")
async def health():
    from database import SessionLocal
    from models import Posting
    db = SessionLocal()
    try:
        count = db.query(Posting).count()
        return {
            "status": "ok",
            "service": "JobPulse AI",
            "version": "1.0.0",
            "postingCount": count,
        }
    finally:
        db.close()


@app.get("/api/vector-stats")
async def vector_stats():
    from routers.stats import vector_stats as get_vstats
    return await get_vstats()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
