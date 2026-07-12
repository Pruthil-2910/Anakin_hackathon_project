"""
Ingestion orchestrator — fetches from Anakin + Adzuna, normalizes, embeds, stores.
Equivalent to src/lib/ingestion.ts.
"""

import asyncio
import hashlib
import json
import uuid
from datetime import datetime
from database import SessionLocal
from models import Posting, IngestionLog, SkillTrend, SalaryByRegion
from anakin import fetch_4dayweek_category, FOURDAYWEEK_CATEGORIES
from adzuna import fetch_adzuna_jobs
from normalizer import (
    canonicalize_region, infer_remote_type, derive_company_from_slug,
    parse_salary_from_badges, parse_work_week_score, derive_role_family,
    derive_job_type, extract_skills,
)


def dedup_key(title: str, company: str | None) -> str:
    return f"{title.lower().strip()}|{(company or '').lower().strip()}"


async def run_ingestion(categories=None, max_pages_per_category=2,
                        include_adzuna=True, skip_embeddings=False) -> dict:
    """Full ingestion: Anakin + Adzuna + embeddings."""
    start = datetime.utcnow()
    categories = categories or FOURDAYWEEK_CATEGORIES
    db = SessionLocal()

    fetched = inserted = skipped = embedded = 0
    errors = []
    seen_titles = set()

    # Pre-load existing titles
    for p in db.query(Posting).with_entities(Posting.title, Posting.company).all():
        seen_titles.add(dedup_key(p.title, p.company))

    log = IngestionLog(id=str(uuid.uuid4()), source="anakin+adzuna", started_at=start)
    db.add(log)
    db.commit()

    # === ANAKIN ===
    for category in categories:
        try:
            for page in range(1, max_pages_per_category + 1):
                try:
                    result = await fetch_4dayweek_category(category, page)
                    fetched += len(result["items"])

                    for item in result["items"]:
                        try:
                            title = item.get("title", "Untitled")
                            company = derive_company_from_slug(item.get("job_id", ""))
                            dk = dedup_key(title, company)
                            if dk in seen_titles:
                                skipped += 1
                                continue
                            seen_titles.add(dk)

                            raw_location = item.get("location", {}).get("raw", "Unknown")
                            region = canonicalize_region(raw_location)
                            remote_type = infer_remote_type(raw_location, item.get("is_remote", False))
                            salary = parse_salary_from_badges(item.get("work_week_badges"))
                            ww = parse_work_week_score(item.get("work_week_badges"))
                            job_type = derive_job_type(title, item.get("work_week_badges"))
                            skills = extract_skills(f"{title} {company or ''}")
                            content_hash = hashlib.sha256(f"{title}|{item.get('item_id')}|4dayweek".encode()).hexdigest()[:32]

                            posting = Posting(
                                id=str(uuid.uuid4()),
                                source="4dayweek",
                                external_id=item.get("item_id"),
                                title=title, company=company,
                                url=item.get("url"), application_url=item.get("application_url"),
                                raw_location=raw_location, region=region, remote_type=remote_type,
                                is_remote=bool(item.get("is_remote")),
                                skills=json.dumps(skills),
                                salary_min=salary["min"] if salary else None,
                                salary_max=salary["max"] if salary else None,
                                currency=salary["currency"] if salary else None,
                                salary_raw=salary["raw"] if salary else None,
                                work_week_score=ww["score"], work_week_label=ww["label"],
                                experience_level=None,
                                posted_date=datetime.fromisoformat(result["scraped_at"].replace("Z", "+00:00")) if result["scraped_at"] else datetime.utcnow(),
                                category_slug=category, job_type=job_type,
                                content_hash=content_hash,
                            )
                            try:
                                db.add(posting)
                                db.commit()
                                inserted += 1

                                if not skip_embeddings:
                                    try:
                                        from embedding import embed
                                        from vectordb import upsert_vector
                                        text = f"{title} at {company or ''} {raw_location} {skills} {category}"
                                        vec = embed(text)
                                        upsert_vector(posting.id, vec, {
                                            "region": region, "job_type": job_type,
                                            "remote_type": remote_type, "category_slug": category,
                                        })
                                        embedded += 1
                                    except Exception as e:
                                        errors.append(f"embed {posting.id}: {e}")
                            except Exception as e:
                                db.rollback()
                                if "UNIQUE" in str(e):
                                    skipped += 1
                        except Exception as e:
                            errors.append(f"normalize: {e}")

                    if len(result["items"]) < 50:
                        break
                except Exception as e:
                    errors.append(f"{category} p{page}: {e}")
                    break
        except Exception as e:
            errors.append(f"{category}: {e}")

    # === ADZUNA ===
    if include_adzuna:
        roles = ["software engineer", "frontend developer", "backend developer", "data scientist",
                 "devops engineer", "mobile developer", "product manager"]
        cities = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai"]

        for role in roles:
            for city in cities:
                for page in range(1, 3):
                    try:
                        raw_jobs = await fetch_adzuna_jobs(role, city, page)
                        fetched += len(raw_jobs)

                        for raw in raw_jobs:
                            try:
                                title = raw["title"]
                                company = raw.get("company")
                                dk = dedup_key(title, company)
                                if dk in seen_titles:
                                    skipped += 1
                                    continue
                                seen_titles.add(dk)

                                skills = extract_skills(f"{title} {raw.get('description', '')}")
                                job_type = derive_job_type(title, contract_time=raw.get("contract_time"),
                                                          contract_type=raw.get("contract_type"))

                                posting = Posting(
                                    id=str(uuid.uuid4()),
                                    source="adzuna", external_id=raw.get("external_id", ""),
                                    title=title, company=company,
                                    url=None, application_url=None,
                                    raw_location=raw.get("city", "India"), region="India",
                                    remote_type=infer_remote_type(raw.get("city"), False),
                                    is_remote=False,
                                    skills=json.dumps(skills),
                                    salary_min=raw.get("salary_min"), salary_max=raw.get("salary_max"),
                                    currency=raw.get("currency"),
                                    salary_raw=f"₹{raw['salary_min']/100000:.1f}L" if raw.get("salary_min") else None,
                                    work_week_score=None, work_week_label=None,
                                    experience_level=raw.get("contract_time"),
                                    posted_date=datetime.fromisoformat(raw["posted_date"].replace("Z", "+00:00")) if raw.get("posted_date") else datetime.utcnow(),
                                    category_slug=f"adzuna-{role.split()[0]}", job_type=job_type,
                                    content_hash=raw["content_hash"],
                                )
                                try:
                                    db.add(posting)
                                    db.commit()
                                    inserted += 1

                                    if not skip_embeddings:
                                        try:
                                            from embedding import embed
                                            from vectordb import upsert_vector
                                            text = f"{title} at {company or ''} {raw.get('city')} India {skills} {role}"
                                            vec = embed(text)
                                            upsert_vector(posting.id, vec, {
                                                "region": "India", "job_type": job_type,
                                                "remote_type": posting.remote_type,
                                                "category_slug": f"adzuna-{role.split()[0]}",
                                            })
                                            embedded += 1
                                        except Exception as e:
                                            errors.append(f"embed adzuna: {e}")
                                except Exception as e:
                                    db.rollback()
                                    if "UNIQUE" in str(e):
                                        skipped += 1
                            except Exception as e:
                                errors.append(f"normalize adzuna: {e}")

                        if len(raw_jobs) < 50:
                            break
                    except Exception as e:
                        errors.append(f"adzuna {role}@{city} p{page}: {e}")
                        break
                    await asyncio.sleep(0.2)

    # Update log
    log.finished_at = datetime.utcnow()
    log.fetched = fetched
    log.inserted = inserted
    log.skipped = skipped
    log.error = "\n".join(errors[:10]) if errors else None
    db.commit()

    total_in_db = db.query(Posting).count()
    db.close()

    return {
        "fetched": fetched, "inserted": inserted, "skipped": skipped,
        "embedded": embedded, "errors": errors,
        "durationMs": int((datetime.utcnow() - start).total_seconds() * 1000),
        "totalInDB": total_in_db,
    }
