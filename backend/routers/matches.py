"""
Matches router — semantic job matching for the current user.
"""

import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User, Posting
from auth import get_current_user
from matcher import score_match

router = APIRouter()


@router.get("/")
async def get_matches(
    limit: int = Query(20, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get top N matched postings for the current user."""
    profile = {
        "skills": json.loads(user.skills or "[]"),
        "target_role": user.target_role,
        "preferred_regions": json.loads(user.preferred_regions or "[]"),
        "preferred_remote_type": user.preferred_remote_type,
        "salary_expectation_min": user.salary_expectation_min,
    }

    postings = db.query(Posting).order_by(Posting.posted_date.desc()).limit(500).all()

    matches = []
    for p in postings:
        posting_data = {
            "id": p.id,
            "title": p.title,
            "company": p.company,
            "region": p.region,
            "remote_type": p.remote_type,
            "skills": json.loads(p.skills or "[]"),
            "salary_min": p.salary_min,
            "salary_max": p.salary_max,
            "currency": p.currency,
            "raw_location": p.raw_location,
            "category_slug": p.category_slug,
        }
        result = score_match(profile, posting_data)
        matches.append(result)

    matches.sort(key=lambda x: x["score"], reverse=True)
    return {"matches": matches[:limit], "total": len(matches), "top_score": matches[0]["score"] if matches else 0}
