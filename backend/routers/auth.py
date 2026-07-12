"""
Auth router — signup, login, me endpoints.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Response
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import SignupRequest, LoginRequest, AuthResponse, UserResponse
from auth import (
    hash_password, verify_password, create_token, get_current_user,
    get_current_user_optional,
)
from config import settings

router = APIRouter()


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest, response: Response, db: Session = Depends(get_db)):
    """Create a new account."""
    if len(req.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(409, "Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=req.email,
        name=req.name,
        password=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id)
    response.set_cookie(
        key="jobpulse_session",
        value=token,
        path="/",
        httponly=True,
        samesite="lax",
        max_age=settings.jwt_expiry_hours * 3600,
    )
    return AuthResponse(
        user=UserResponse(id=user.id, email=user.email, name=user.name),
        token=token,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Sign in."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password):
        raise HTTPException(401, "Invalid email or password")

    token = create_token(user.id)
    response.set_cookie(
        key="jobpulse_session",
        value=token,
        path="/",
        httponly=True,
        samesite="lax",
        max_age=settings.jwt_expiry_hours * 3600,
    )
    return AuthResponse(
        user=UserResponse(id=user.id, email=user.email, name=user.name),
        token=token,
    )


@router.post("/logout")
async def logout(response: Response):
    """Clear session cookie."""
    response.delete_cookie(key="jobpulse_session", path="/")
    return {"status": "ok"}


@router.get("/me")
async def me(
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Get current user + saved job count."""
    if not user:
        return {
            "user": None,
            "savedJobCount": 0,
        }
    from models import SavedJob
    saved_count = db.query(SavedJob).filter(SavedJob.user_id == user.id).count()
    return {
        "user": UserResponse(id=user.id, email=user.email, name=user.name),
        "savedJobCount": saved_count,
    }
