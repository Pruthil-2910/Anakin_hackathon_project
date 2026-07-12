"""
Ticker router — skill trend banner ticker data.
"""

from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import SkillTrend

router = APIRouter()


@router.get("/")
async def get_ticker(db: Session = Depends(get_db)):
    """Retrieve skill trends to display in the UI banner ticker."""
    latest = db.query(SkillTrend).order_by(SkillTrend.week_start.desc()).first()
    if not latest:
        return {
            "items": [],
            "weekStart": None,
            "generatedAt": datetime.utcnow().isoformat(),
        }

    rows = db.query(SkillTrend).filter(SkillTrend.week_start == latest.week_start).all()

    items = [
        {
            "skill": r.skill,
            "pctChangeWow": r.pct_change_wow or 0.0,
            "mentionCount": r.mention_count,
            "direction": "up" if (r.pct_change_wow or 0.0) >= 0 else "down",
        }
        for r in rows
    ]

    items.sort(key=lambda x: x["mentionCount"], reverse=True)
    items = items[:25]

    return {
        "items": items,
        "weekStart": latest.week_start.isoformat(),
        "generatedAt": datetime.utcnow().isoformat(),
    }
