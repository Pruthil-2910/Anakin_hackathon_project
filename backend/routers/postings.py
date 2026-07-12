"""
Postings router — list + detail endpoints.
"""

import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Posting, User
from auth import get_current_user
from normalizer import derive_role_family

router = APIRouter()


@router.get("/")
async def list_postings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, le=100),
    region: str = "all",
    role_family: str = "all",
    remote_type: str = "all",
    jobType: str = Query("all", alias="jobType"),
    skill: str = "all",
    category: str = "all",
    db: Session = Depends(get_db),
):
    """Paginated, filterable job postings."""
    query = db.query(Posting)

    if region != "all":
        query = query.filter(Posting.region == region)
    if remote_type != "all":
        query = query.filter(Posting.remote_type == remote_type)
    if jobType != "all":
        query = query.filter(Posting.job_type == jobType)
    if category != "all":
        query = query.filter(Posting.category_slug == category)
    if skill != "all":
        query = query.filter(Posting.skills.contains(f'"{skill.lower()}"'))

    # Role family filter (derived from title)
    if role_family != "all":
        # This is a simplification — in production you'd pre-compute role_family
        keywords = ROLE_FAMILY_KEYWORDS.get(role_family, [])
        from sqlalchemy import or_
        conditions = [Posting.title.ilike(f"%{kw}%") for kw in keywords]
        if conditions:
            query = query.filter(or_(*conditions))

    total = query.count()
    offset = (page - 1) * page_size
    rows = query.order_by(Posting.posted_date.desc()).offset(offset).limit(page_size).all()

    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": max(1, (total + page_size - 1) // page_size),
        "data": [serialize_posting(p) for p in rows],
    }


@router.get("/detail")
async def posting_detail(id: str, db: Session = Depends(get_db)):
    """Single posting + similar jobs."""
    posting = db.query(Posting).filter(Posting.id == id).first()
    if not posting:
        raise HTTPException(404, "Not found")

    # Find similar (same region or shared skill)
    skills = json.loads(posting.skills or "[]")
    similar_query = db.query(Posting).filter(Posting.id != id)
    if skills:
        similar_query = similar_query.filter(
            Posting.skills.contains(f'"{skills[0]}"') | (Posting.region == posting.region)
        )
    similar = similar_query.order_by(Posting.posted_date.desc()).limit(5).all()

    return {
        "posting": serialize_posting(posting),
        "similar": [serialize_posting(s) for s in similar],
    }


def serialize_posting(p: Posting) -> dict:
    return {
        "id": p.id,
        "source": p.source,
        "externalId": p.external_id,
        "title": p.title,
        "company": p.company,
        "url": p.url,
        "applicationUrl": p.application_url,
        "rawLocation": p.raw_location,
        "region": p.region,
        "remoteType": p.remote_type,
        "isRemote": p.is_remote,
        "skills": json.loads(p.skills or "[]"),
        "salaryMin": p.salary_min,
        "salaryMax": p.salary_max,
        "currency": p.currency,
        "salaryRaw": p.salary_raw,
        "workWeekScore": p.work_week_score,
        "workWeekLabel": p.work_week_label,
        "experienceLevel": p.experience_level,
        "postedDate": p.posted_date.isoformat() if p.posted_date else None,
        "scrapedAt": p.scraped_at.isoformat() if p.scraped_at else None,
        "categorySlug": p.category_slug,
        "jobType": p.job_type,
        "contentHash": p.content_hash,
    }


ROLE_FAMILY_KEYWORDS = {
    "Backend Engineer": ["backend", "api", "django", "fastapi", "spring", "node", "elixir"],
    "Frontend Engineer": ["frontend", "front-end", "react", "vue", "angular"],
    "Fullstack Engineer": ["fullstack", "full stack", "full-stack"],
    "ML/AI Engineer": ["ml", "machine learning", "ai engineer", "data scientist"],
    "Data Engineer": ["data engineer", "etl", "spark", "airflow"],
    "DevOps/SRE": ["devops", "sre", "platform", "cloud", "kubernetes"],
    "Mobile Engineer": ["mobile", "android", "ios", "react native", "flutter"],
    "QA Engineer": ["qa", "test", "automation"],
    "Product/Program Manager": ["product manager", "program manager"],
    "Designer": ["design", "ux", "ui"],
    "Engineering Manager": ["engineering manager", "head of engineering", "cto"],
}
