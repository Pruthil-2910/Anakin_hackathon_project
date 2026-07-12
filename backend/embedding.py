"""
Embedding service — uses sentence-transformers all-MiniLM-L6-v2 (offline).
Equivalent to src/lib/embedding.ts in the Next.js version.
"""

import numpy as np
from functools import lru_cache

_embedder = None


@lru_cache(maxsize=1)
def get_embedder():
    """Lazy-load the sentence-transformers model (cached after first call)."""
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        print("Loading all-MiniLM-L6-v2 model...")
        _embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        print("Model loaded.")
    return _embedder


def embed(text: str) -> np.ndarray:
    """Generate a 384-dim embedding for a text string. Returns L2-normalized vector."""
    embedder = get_embedder()
    vec = embedder.encode(text, normalize_embeddings=True)
    return vec.astype(np.float32)


def embed_batch(texts: list[str]) -> list[np.ndarray]:
    """Batch embed multiple texts."""
    embedder = get_embedder()
    vecs = embedder.encode(texts, normalize_embeddings=True, batch_size=32)
    return [v.astype(np.float32) for v in vecs]


def to_bytes(vec: np.ndarray) -> bytes:
    """Convert numpy array to bytes for sqlite-vec storage."""
    return vec.tobytes()
