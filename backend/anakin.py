"""
Anakin API client — async task submission + polling.
Equivalent to src/lib/anakin.ts.
"""

import httpx
import asyncio
from config import settings

ANAKIN_BASE = "https://anakin.io/v1/wire"


async def run_anakin_task(action_id: str, params: dict, timeout_ms: int = 60000) -> dict:
    """Submit an Anakin task and poll until completion."""
    async with httpx.AsyncClient(timeout=30) as client:
        # Submit
        resp = await client.post(
            f"{ANAKIN_BASE}/task",
            headers={
                "X-API-Key": settings.anakin_api_key,
                "Content-Type": "application/json",
            },
            json={"action_id": action_id, "params": params},
        )
        resp.raise_for_status()
        task = resp.json()

        # Poll
        deadline = asyncio.get_event_loop().time() + (timeout_ms / 1000)
        while asyncio.get_event_loop().time() < deadline:
            await asyncio.sleep(2)
            resp = await client.get(
                f"{ANAKIN_BASE}/jobs/{task['job_id']}",
                headers={"X-API-Key": settings.anakin_api_key},
            )
            job = resp.json()
            if job.get("status") == "completed" or job.get("data", {}).get("status") == "ok":
                return job
            if job.get("status") == "failed" or job.get("data", {}).get("error"):
                raise Exception(f"Anakin failed: {job.get('data', {}).get('error')}")

    raise TimeoutError(f"Anakin timeout ({timeout_ms}ms)")


async def fetch_4dayweek_category(category_slug: str, page: int = 1) -> dict:
    """Fetch one page of 4dayweek.io category jobs via Anakin."""
    job = await run_anakin_task(
        "act_4dayweek_io_category_job_listing",
        {"category_slug": category_slug, "page": page},
    )
    inner = job.get("data", {}).get("data", {})
    if not inner.get("items"):
        raise Exception(f"No items for {category_slug} page {page}")
    return {
        "items": inner["items"],
        "total_count": inner.get("total_count", len(inner["items"])),
        "scraped_at": job.get("data", {}).get("meta", {}).get("scraped_at", ""),
    }


FOURDAYWEEK_CATEGORIES = [
    "engineering-jobs", "marketing-jobs", "product-jobs", "data-jobs",
    "devops-jobs", "sales-jobs", "operations-jobs", "finance-jobs",
    "customer-support-jobs",
]
