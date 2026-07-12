"""
Resume router — get + auto-save resume data.
"""

import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import ResumeData
from auth import get_current_user

router = APIRouter()


@router.get("/")
async def get_resume(user: User = Depends(get_current_user)):
    """Get the current user's resume data."""
    data = json.loads(user.resume_data or "{}")
    return {
        **data,
        "contact": data.get("contact", {
            "name": user.name or "",
            "email": user.email,
            "headline": user.headline or "",
        }),
        "skills": data.get("skills", json.loads(user.skills or "[]")),
    }


@router.put("/")
async def update_resume(req: ResumeData, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Auto-save resume data."""
    user.resume_data = json.dumps(req.model_dump())
    db.commit()
    return {"ok": True, "resumeData": req.model_dump()}
