"""
Saved jobs router — save, unsave, list.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User, SavedJob, Posting
from auth import get_current_user
from routers.postings import serialize_posting

router = APIRouter()


@router.get("/")
async def list_saved(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List the current user's saved jobs."""
    saved = db.query(SavedJob).filter(SavedJob.user_id == user.id).order_by(SavedJob.saved_at.desc()).all()
    return {
        "savedJobs": [
            {
                "id": s.id,
                "savedAt": s.saved_at.isoformat() if s.saved_at else None,
                "posting": serialize_posting(s.posting),
            }
            for s in saved
        ]
    }


from schemas import SaveJobRequest


@router.post("/")
async def save_job(
    req: SaveJobRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a job."""
    posting_id = req.posting_id
    posting = db.query(Posting).filter(Posting.id == posting_id).first()
    if not posting:
        raise HTTPException(404, "Posting not found")

    existing = db.query(SavedJob).filter(
        SavedJob.user_id == user.id, SavedJob.posting_id == posting_id
    ).first()
    if existing:
        return {"ok": True, "alreadySaved": True}

    saved = SavedJob(id=str(uuid.uuid4()), user_id=user.id, posting_id=posting_id)
    db.add(saved)
    db.commit()
    return {"ok": True, "savedJob": {"id": saved.id, "savedAt": saved.saved_at.isoformat()}}


@router.delete("/")
async def unsave_job(
    postingId: str = Query(..., alias="postingId"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a saved job."""
    db.query(SavedJob).filter(
        SavedJob.user_id == user.id, SavedJob.posting_id == postingId
    ).delete()
    db.commit()
    return {"ok": True}
