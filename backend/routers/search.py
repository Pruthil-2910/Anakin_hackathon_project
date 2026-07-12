"""
Search router — semantic vector search endpoint.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from vector_search import semantic_search

router = APIRouter()


@router.get("/")
async def search(
    q: str = Query(..., min_length=1),
    region: str = "all",
    jobType: str = Query("all", alias="jobType"),
    remoteType: str = Query("all", alias="remoteType"),
    limit: int = Query(20, le=100),
):
    """Semantic search over postings using vector similarity (sqlite-vec)."""
    filters = {"limit": limit}
    if region != "all":
        filters["region"] = region
    if jobType != "all":
        filters["job_type"] = jobType
    if remoteType != "all":
        filters["remote_type"] = remoteType

    try:
        results = await semantic_search(q, **filters)
        return {"query": q, "filters": filters, "count": len(results), "results": results}
    except Exception as e:
        raise HTTPException(500, str(e))
