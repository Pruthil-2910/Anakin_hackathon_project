"""
Vector search service — embeds a query and searches the sqlite-vec index.
Equivalent to src/lib/vector-search.ts.
"""

import json
from embedding import embed
from vectordb import search_vectors
from database import SessionLocal
from models import Posting


async def semantic_search(query: str, limit: int = 20, region: str = None,
                          job_type: str = None, remote_type: str = None,
                          category_slug: str = None) -> list[dict]:
    """Semantic search: embed query → search vectors → load full postings."""
    # 1. Embed
    query_vec = embed(query)

    # 2. Search
    vec_results = search_vectors(
        query_vec,
        limit=limit,
        region=region,
        job_type=job_type,
        remote_type=remote_type,
        category_slug=category_slug,
    )

    if not vec_results:
        return []

    # 3. Load postings
    posting_ids = [r[2] for r in vec_results]  # postingId is column 2
    db = SessionLocal()
    try:
        postings = db.query(Posting).filter(Posting.id.in_(posting_ids)).all()
        posting_map = {p.id: p for p in postings}
    finally:
        db.close()

    # 4. Join + compute similarity
    results = []
    for row in vec_results:
        rowid, distance, posting_id, r_region, r_job_type, r_remote, r_category = row
        p = posting_map.get(posting_id)
        if not p:
            continue
        similarity = max(0, 1 - distance / 2)
        results.append({
            "posting": {
                "id": p.id, "title": p.title, "company": p.company,
                "region": p.region, "rawLocation": p.raw_location,
                "remoteType": p.remote_type, "jobType": p.job_type,
                "categorySlug": p.category_slug, "salaryRaw": p.salary_raw,
                "skills": json.loads(p.skills or "[]"),
                "postedDate": p.posted_date.isoformat() if p.posted_date else None,
                "source": p.source,
            },
            "score": similarity,
            "distance": distance,
        })

    return results
