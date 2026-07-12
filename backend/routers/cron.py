"""
Cron router — ingestion trigger (secret-protected).
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from config import settings
from ingestion import run_ingestion

router = APIRouter()


@router.post("/ingest")
async def ingest(
    secret: str = Query(...),
    categories: str = None,
    max_pages: int = 2,
    include_adzuna: bool = True,
    skip_embeddings: bool = False,
):
    """Trigger ingestion (cron-protected)."""
    if secret != settings.cron_secret:
        raise HTTPException(401, "Unauthorized")

    cat_list = categories.split(",") if categories else None
    result = await run_ingestion(
        categories=cat_list,
        max_pages_per_category=max_pages,
        include_adzuna=include_adzuna,
        skip_embeddings=skip_embeddings,
    )
    return {"ok": True, "result": result}


@router.get("/ingest")
async def ingest_get(
    secret: str = Query(...),
    categories: str = None,
    max_pages: int = 2,
    include_adzuna: bool = True,
    skip_embeddings: bool = False,
):
    """GET version (for cron-job.org style triggers)."""
    return await ingest(secret, categories, max_pages, include_adzuna, skip_embeddings)
