"""
Trends router — skill trends + salary heatmap.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import SkillTrend, SalaryByRegion

router = APIRouter()


@router.get("/skills")
async def get_skills_trends(
    limit: int = Query(15, ge=1),
    db: Session = Depends(get_db),
):
    """Retrieve skill demand trends (rising and cooling)."""
    latest = db.query(SkillTrend).order_by(SkillTrend.week_start.desc()).first()
    if not latest:
        return {"rising": [], "falling": [], "weekStart": None, "total": 0}

    rows = db.query(SkillTrend).filter(SkillTrend.week_start == latest.week_start).all()

    # Rising: sort by mention_count desc, direction is up
    rising_candidates = [r for r in rows if (r.pct_change_wow or 0) > 0]
    rising_candidates.sort(key=lambda x: x.mention_count, reverse=True)
    rising = [
        {
            "skill": r.skill,
            "mentionCount": r.mention_count,
            "pctChangeWow": r.pct_change_wow or 0.0,
            "direction": "up",
        }
        for r in rising_candidates[:limit]
    ]

    # Falling/Cooling: sort by mention_count asc, direction is down (exclude rising)
    rising_skills = {x["skill"] for x in rising}
    falling_candidates = [r for r in rows if r.skill not in rising_skills]
    falling_candidates.sort(key=lambda x: x.mention_count)
    falling = [
        {
            "skill": r.skill,
            "mentionCount": r.mention_count,
            "pctChangeWow": r.pct_change_wow or 0.0,
            "direction": "down",
        }
        for r in falling_candidates[:limit]
    ]

    return {
        "weekStart": latest.week_start.isoformat(),
        "rising": rising,
        "falling": falling,
        "total": len(rows),
    }


@router.get("/salary-heatmap")
async def get_salary_heatmap(db: Session = Depends(get_db)):
    """Retrieve salary aggregation heatmap cells."""
    latest = db.query(SalaryByRegion).order_by(SalaryByRegion.week_start.desc()).first()
    if not latest:
        return {"cells": [], "weekStart": None, "regions": [], "roleFamilies": []}

    rows = db.query(SalaryByRegion).filter(
        SalaryByRegion.week_start == latest.week_start
    ).order_by(SalaryByRegion.region.asc(), SalaryByRegion.role_family.asc()).all()

    # Get distinct regions and role families preserving sorting
    regions = sorted(list(set(r.region for r in rows)))
    role_families = sorted(list(set(r.role_family for r in rows)))

    cells = [
        {
            "region": r.region,
            "roleFamily": r.role_family,
            "medianSalaryMin": r.median_salary_min,
            "medianSalaryMax": r.median_salary_max,
            "sampleSize": r.sample_size,
        }
        for r in rows
    ]

    return {
        "weekStart": latest.week_start.isoformat(),
        "regions": regions,
        "roleFamilies": role_families,
        "cells": cells,
    }
