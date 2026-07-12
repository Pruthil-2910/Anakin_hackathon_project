"""
Adzuna API client — fetch jobs from Adzuna with retry.
Equivalent to src/lib/adzuna.ts.
"""

import hashlib
import asyncio
import httpx
from config import settings

ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs"


async def fetch_adzuna_jobs(role: str, city: str, page: int = 1) -> list[dict]:
    """Fetch one page of Adzuna jobs for a role+city."""
    url = f"{ADZUNA_BASE}/{settings.adzuna_country}/search/{page}"
    params = {
        "app_id": settings.adzuna_app_id,
        "app_key": settings.adzuna_app_key,
        "what": role,
        "where": city,
        "results_per_page": 50,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        for attempt in range(3):
            try:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
                results = data.get("results", [])
                return [
                    {
                        "source": "adzuna",
                        "external_id": r.get("id"),
                        "title": r.get("title", "Untitled"),
                        "company": r.get("company", {}).get("display_name"),
                        "city": r.get("location", {}).get("display_name"),
                        "salary_min": r.get("salary_min") if r.get("salary_min", 0) > 0 else None,
                        "salary_max": r.get("salary_max") if r.get("salary_max", 0) > 0 else None,
                        "currency": "INR",
                        "posted_date": r.get("created"),
                        "description": r.get("description"),
                        "contract_time": r.get("contract_time"),
                        "contract_type": r.get("contract_type"),
                        "content_hash": hashlib.sha256(
                            f"{r.get('title', '')}|{r.get('company', {}).get('display_name', '')}|{r.get('created', '')[:10]}|adzuna".encode()
                        ).hexdigest()[:32],
                    }
                    for r in results
                ]
            except Exception:
                await asyncio.sleep(0.5 * (2 ** attempt))
    return []
