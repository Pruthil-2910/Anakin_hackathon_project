"""
Stats router — dashboard statistics.
"""

import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db
from models import Posting, IngestionLog

router = APIRouter()

_cache = {"ts": 0, "data": None}
CACHE_TTL = 60  # seconds


@router.get("/")
async def get_stats(db: Session = Depends(get_db)):
    """Dashboard stats: totals, breakdowns by category/region/job_type."""
    import time
    now = time.time()
    if _cache["data"] and now - _cache["ts"] < CACHE_TTL:
        return _cache["data"]

    total = db.query(Posting).count()
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent = db.query(Posting).filter(Posting.posted_date >= week_ago).count()

    regions = db.query(Posting.region).distinct().all()
    regions_covered = sorted([r[0] for r in regions if r[0]])

    categories = db.query(Posting.category_slug, func.count(Posting.id)).group_by(Posting.category_slug).all()
    remote = db.query(Posting.remote_type, func.count(Posting.id)).group_by(Posting.remote_type).all()
    job_types = db.query(Posting.job_type, func.count(Posting.id)).group_by(Posting.job_type).all()

    last_ingestion = db.query(IngestionLog).order_by(IngestionLog.started_at.desc()).first()

    data = {
        "totalPostings": total,
        "recentPostings": recent,
        "regionsCovered": regions_covered,
        "categories": [{"slug": c[0], "count": c[1]} for c in categories],
        "remoteBreakdown": [{"type": r[0], "count": r[1]} for r in remote],
        "jobTypeBreakdown": [{"type": j[0], "count": j[1]} for j in job_types],
        "lastIngestion": {
            "startedAt": last_ingestion.started_at.isoformat() if last_ingestion else None,
            "finishedAt": last_ingestion.finished_at.isoformat() if last_ingestion and last_ingestion.finished_at else None,
            "fetched": last_ingestion.fetched if last_ingestion else 0,
            "inserted": last_ingestion.inserted if last_ingestion else 0,
            "skipped": last_ingestion.skipped if last_ingestion else 0,
            "error": last_ingestion.error if last_ingestion else None,
        } if last_ingestion else None,
    }

    _cache["data"] = data
    _cache["ts"] = now
    return data


@router.get("/vector-stats")
async def vector_stats():
    """Vector coverage stats."""
    from vectordb import get_vector_count
    from database import SessionLocal
    from models import Posting

    db = SessionLocal()
    try:
        posting_count = db.query(Posting).count()
    finally:
        db.close()

    vector_count = get_vector_count()
    return {
        "postingsWithVectors": vector_count,
        "totalPostings": posting_count,
        "coverage": round((vector_count / posting_count * 100)) if posting_count > 0 else 0,
    }
