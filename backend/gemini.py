"""
Gemini LLM client — uses Google's Generative Language API directly via requests.
Falls back to a generic completion if Gemini fails.

Equivalent to src/lib/gemini.ts in the Next.js version.
"""

import requests
from config import settings

GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def call_gemini(messages: list[dict], temperature: float = 0.4, max_tokens: int = 800) -> str:
    """
    Call Gemini with OpenAI-style messages.
    Returns the generated text.
    """
    api_key = settings.gemini_api_key
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    # Split system messages from conversation
    system_messages = [m for m in messages if m["role"] == "system"]
    conversation = [m for m in messages if m["role"] != "system"]

    system_instruction = "\n\n---\n\n".join(m["content"] for m in system_messages)

    # Convert to Gemini format
    contents = []
    for m in conversation:
        role = "model" if m["role"] == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": m["content"]}]})

    body = {
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
            "topP": 0.95,
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ],
    }

    if system_instruction:
        body["systemInstruction"] = {"parts": [{"text": system_instruction}]}

    url = f"{GEMINI_BASE}/{GEMINI_MODEL}:generateContent?key={api_key}"
    response = requests.post(url, json=body, timeout=30)

    if response.status_code != 200:
        raise Exception(f"Gemini API {response.status_code}: {response.text[:200]}")

    data = response.json()
    candidates = data.get("candidates", [])
    if not candidates:
        raise Exception("Gemini returned no candidates")

    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    return text


def call_llm(messages: list[dict], temperature: float = 0.4, max_tokens: int = 800) -> dict:
    """
    Try Gemini first, return {text, provider}.
    Falls back to None if Gemini fails.
    """
    try:
        text = call_gemini(messages, temperature, max_tokens)
        if text:
            return {"text": text, "provider": "gemini"}
    except Exception as e:
        print(f"Gemini failed: {e}")

    # Fallback: you can add z-ai-web-dev-sdk HTTP client here
    return {"text": "", "provider": "none"}
