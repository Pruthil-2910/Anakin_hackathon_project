"""
Vector database — sqlite-vec for vector storage + cosine similarity search.
Equivalent to src/lib/vectordb.ts in the Next.js version.

Uses sqlite-vec Python package: pip install sqlite-vec
"""

import sqlite3
import sqlite_vec
import numpy as np
from typing import Optional
from config import settings

_db = None


def get_vector_db():
    """Get a singleton connection to the vector database."""
    global _db
    if _db is None:
        _db = sqlite3.connect(settings.vector_db_path)
        _db.enable_load_extension(True)
        sqlite_vec.load(_db)
        _db.enable_load_extension(False)
        _db.execute("PRAGMA journal_mode=WAL")
        _db.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS posting_vectors USING vec0(
                embedding float[384],
                postingId text,
                region text,
                jobType text,
                remoteType text,
                categorySlug text
            )
        """)
        _db.execute("""
            CREATE TABLE IF NOT EXISTS posting_vector_map (
                postingId text primary key,
                rowid_in_vec integer not null,
                embeddedAt text not null
            )
        """)
    return _db


def upsert_vector(posting_id: str, embedding: np.ndarray, metadata: dict):
    """Insert or replace a posting's embedding."""
    db = get_vector_db()
    vec_bytes = embedding.tobytes()

    # Check if exists
    existing = db.execute(
        "SELECT rowid_in_vec FROM posting_vector_map WHERE postingId = ?",
        (posting_id,)
    ).fetchone()

    if existing:
        db.execute("DELETE FROM posting_vectors WHERE rowid = ?", (existing[0],))
        db.execute("DELETE FROM posting_vector_map WHERE postingId = ?", (posting_id,))

    # Insert new vector
    cursor = db.execute(
        "INSERT INTO posting_vectors (embedding, postingId, region, jobType, remoteType, categorySlug) VALUES (?, ?, ?, ?, ?, ?)",
        (vec_bytes, posting_id, metadata["region"], metadata["jobType"], metadata["remoteType"], metadata["categorySlug"])
    )
    db.execute(
        "INSERT INTO posting_vector_map (postingId, rowid_in_vec, embeddedAt) VALUES (?, ?, ?)",
        (posting_id, cursor.lastrowid, datetime.now().isoformat())
    )
    db.commit()


def search_vectors(query_embedding: np.ndarray, limit: int = 20,
                   region: Optional[str] = None, job_type: Optional[str] = None,
                   remote_type: Optional[str] = None, category_slug: Optional[str] = None):
    """Search for similar postings by embedding vector with metadata filters."""
    db = get_vector_db()
    vec_bytes = query_embedding.tobytes()
    has_filters = any([region, job_type, remote_type, category_slug])

    def do_search(k: int):
        return db.execute(
            "SELECT rowid, distance, postingId, region, jobType, remoteType, categorySlug "
            "FROM posting_vectors WHERE embedding MATCH ? AND k = ? ORDER BY distance",
            (vec_bytes, k)
        ).fetchall()

    def apply_filters(results):
        return [r for r in results if
                (not region or r[3] == region) and
                (not job_type or r[4] == job_type) and
                (not remote_type or r[5] == remote_type) and
                (not category_slug or r[6] == category_slug)]

    if not has_filters:
        return do_search(limit)[:limit]

    # Pass 1: over-fetch
    filtered = apply_filters(do_search(limit * 20))
    if len(filtered) >= limit:
        return filtered[:limit]

    # Pass 2: fetch all
    filtered = apply_filters(do_search(2000))
    if len(filtered) > 0:
        return filtered[:limit]

    # Pass 3: fallback
    return do_search(limit)[:limit]


def get_vector_count() -> int:
    """Count of vectors stored."""
    db = get_vector_db()
    result = db.execute("SELECT COUNT(*) FROM posting_vector_map").fetchone()
    return result[0]


from datetime import datetime
