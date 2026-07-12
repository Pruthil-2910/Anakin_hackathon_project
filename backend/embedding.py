"""
Embedding service — uses Gemini API text-embedding-004 with 384 dimensions.
"""

import numpy as np
from config import settings
import requests

def get_embedder():
    """No-op for compatibility."""
    return None

def embed(text: str) -> np.ndarray:
    """Generate a 384-dim embedding for a text string using Gemini API."""
    if not settings.gemini_api_key:
        print("Warning: GEMINI_API_KEY is not set. Returning a zero vector.")
        return np.zeros(384, dtype=np.float32)
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={settings.gemini_api_key}"
    payload = {
        "model": "models/text-embedding-004",
        "content": {
            "parts": [{"text": text}]
        },
        "outputDimensionality": 384
    }
    
    try:
        res = requests.post(url, json=payload, timeout=10)
        res.raise_for_status()
        values = res.json()["embedding"]["values"]
        return np.array(values, dtype=np.float32)
    except Exception as e:
        print(f"Error calling Gemini Embedding API: {e}")
        return np.zeros(384, dtype=np.float32)


def embed_batch(texts: list[str]) -> list[np.ndarray]:
    """Batch embed multiple texts using Gemini API."""
    return [embed(t) for t in texts]


def to_bytes(vec: np.ndarray) -> bytes:
    """Convert numpy array to bytes for sqlite-vec storage."""
    return vec.tobytes()
