"""
Profile router — get + update user profile.
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import ProfileResponse, ProfileUpdate
from auth import get_current_user

router = APIRouter()


@router.get("/", response_model=ProfileResponse)
async def get_profile(user: User = Depends(get_current_user)):
    """Get the current user's profile."""
    return ProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        headline=user.headline,
        bio=user.bio,
        skills=json.loads(user.skills or "[]"),
        experience_years=user.experience_years,
        current_role=user.current_role,
        target_role=user.target_role,
        preferred_regions=json.loads(user.preferred_regions or "[]"),
        preferred_remote_type=user.preferred_remote_type,
        salary_expectation_min=user.salary_expectation_min,
        salary_currency=user.salary_currency,
        resume_data=json.loads(user.resume_data or "{}"),
        created_at=user.created_at,
    )


@router.put("/", response_model=ProfileResponse)
async def update_profile(req: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update the current user's profile."""
    update_data = req.model_dump(exclude_unset=True)

    # JSON-encode list/dict fields
    if "skills" in update_data and update_data["skills"] is not None:
        update_data["skills"] = json.dumps([s.lower() for s in update_data["skills"][:50]])
    if "preferred_regions" in update_data and update_data["preferred_regions"] is not None:
        update_data["preferred_regions"] = json.dumps(update_data["preferred_regions"][:20])
    if "resume_data" in update_data and update_data["resume_data"] is not None:
        update_data["resume_data"] = json.dumps(update_data["resume_data"])

    # Remove None values (don't update fields not provided)
    update_data = {k: v for k, v in update_data.items() if v is not None}

    for key, value in update_data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)

    return await get_profile(user)
