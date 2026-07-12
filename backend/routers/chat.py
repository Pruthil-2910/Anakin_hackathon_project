"""
Chat router — RAG-powered chatbot with Gemini + vector search.
"""

import re
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, ChatMessage
from schemas import ChatRequest, ChatResponse
from auth import get_current_user
from gemini import call_llm

router = APIRouter()

# === SAFETY: forbidden patterns ===
FORBIDDEN_PATTERNS = [
    r"\bdelete\b", r"\bdrop\b", r"\btruncate\b", r"\bwipe\b", r"\berase\b",
    r"\bdestroy\b", r"\bclear\b.*\b(database|table|all)\b",
    r"\bupdate\b.*\b(set|where)\b", r"\binsert\s+into\b",
    r"\bremove\b.*\b(job|posting|user|record)\b",
    r"\bmodify\b.*\b(job|posting|user|record|database)\b",
    r"\bedit\b.*\b(job|posting|user|record|database)\b",
    r"\breset\b.*\b(database|table)\b", r"\bdrop\b.*\btable\b",
]

def is_forbidden(message: str) -> bool:
    return any(re.search(p, message, re.IGNORECASE) for p in FORBIDDEN_PATTERNS)

# === INTENT DETECTION ===
SEARCH_INTENT_PATTERNS = [
    r"\bjobs?\b.*\b(in|at|near|for|that|which|suit|match|fit)\b",
    r"\b(find|search|looking for|show me|list)\b.*\b(jobs?|roles?|positions?)\b",
    r"\b(how many|count)\b.*\b(jobs?|roles?|positions?)\b",
    r"\b(suit|match|fit|relevant)\b.*\b(me|my|profile)\b",
    r"\b(bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|remote|usa|uk)\b",
    r"\b(react|python|java|frontend|backend|devops|ml|ai)\b.*\b(jobs?|roles?)\b",
    r"\b(intern|part.?time|full.?time|contract)\b.*\b(jobs?|roles?)\b",
]

def needs_search(message: str) -> bool:
    return any(re.search(p, message, re.IGNORECASE) for p in SEARCH_INTENT_PATTERNS)

def extract_filters(message: str) -> dict:
    filters = {}
    if re.search(r"\bbangalore\b|\bbengaluru\b|\bmumbai\b|\bdelhi\b|\bhyderabad\b|\bpune\b|\bchennai\b", message, re.IGNORECASE):
        filters["region"] = "India"
    elif re.search(r"\busa\b|\bamerica\b", message, re.IGNORECASE):
        filters["region"] = "USA"
    elif re.search(r"\buk\b|\blondon\b", message, re.IGNORECASE):
        filters["region"] = "UK"
    elif re.search(r"\bremote\b", message, re.IGNORECASE):
        filters["remote_type"] = "remote"

    if re.search(r"\bintern(ship)?\b", message, re.IGNORECASE):
        filters["job_type"] = "intern"
    elif re.search(r"\bpart[\s-]?time\b", message, re.IGNORECASE):
        filters["job_type"] = "part-time"
    elif re.search(r"\bcontract\b", message, re.IGNORECASE):
        filters["job_type"] = "contract"

    # Clean search query
    q = message
    q = re.sub(r"\b(how many|count|find|search|show me|list|looking for)\b", "", q, flags=re.IGNORECASE)
    q = re.sub(r"\b(positions?|openings?)\b", " ", q, flags=re.IGNORECASE)
    q = re.sub(r"\b(near|that|which|are|is|the|a|an)\b", " ", q, flags=re.IGNORECASE)
    q = re.sub(r"\b(suit|match|fit|relevant|me|my|profile)\b", " ", q, flags=re.IGNORECASE)
    q = re.sub(r"\s+", " ", q).strip()
    filters["search_query"] = q or message
    return filters


async def build_data_context(db: Session) -> str:
    """Build read-only data context (stats, top skills, etc.)."""
    from models import Posting, SkillTrend
    from sqlalchemy import func

    total = db.query(Posting).count()
    top_skills = db.query(SkillTrend).order_by(SkillTrend.mention_count.desc()).limit(20).all()
    categories = db.query(Posting.category_slug, func.count()).group_by(Posting.category_slug).all()
    regions = db.query(Posting.region, func.count()).group_by(Posting.region).order_by(func.count().desc()).limit(15).all()
    job_types = db.query(Posting.job_type, func.count()).group_by(Posting.job_type).all()

    lines = [f"DATABASE OVERVIEW (read-only snapshot):", f"- Total job postings: {total}", "",
             "JOB TYPE BREAKDOWN:"]
    for jt, c in job_types:
        lines.append(f"  - {jt}: {c}")
    lines.append("\nTOP SKILLS:")
    for i, s in enumerate(top_skills, 1):
        lines.append(f"  {i}. {s.skill} — {s.mention_count} mentions")
    lines.append("\nPOSTINGS BY CATEGORY:")
    for cat, c in categories:
        lines.append(f"  - {cat}: {c}")
    lines.append("\nPOSTINGS BY REGION (top 15):")
    for r, c in regions:
        lines.append(f"  - {r}: {c}")
    return "\n".join(lines)


async def build_search_context(query: str, filters: dict, user: User) -> str:
    """Build RAG context from vector search."""
    from vector_search import semantic_search

    # Enhance with user profile
    enhanced = query
    if user.skills:
        enhanced += " " + " ".join(json.loads(user.skills or "[]"))
    if user.target_role:
        enhanced += " " + user.target_role

    try:
        results = await semantic_search(enhanced, limit=15, **{
            k: v for k, v in filters.items() if k != "search_query"
        })
        if not results:
            return f'VECTOR SEARCH RESULTS for "{query}": No matching postings found.'

        lines = [f'VECTOR SEARCH RESULTS for "{query}" (top {len(results)} matches):',
                 f'(Filters: region={filters.get("region", "any")}, jobType={filters.get("job_type", "any")}, remoteType={filters.get("remote_type", "any")})',
                 f'(Total matching: {len(results)})\n']
        for i, r in enumerate(results, 1):
            p = r["posting"]
            match_pct = round(r["score"] * 100)
            salary = f" / {p['salaryRaw']}" if p.get("salaryRaw") else ""
            lines.append(f'{i}. [{match_pct}% match] "{p["title"]}" at {p.get("company") or "Unknown"} — {p.get("region") or "?"} / {p.get("remoteType")} / {p.get("jobType")}{salary}')
            if p.get("skills"):
                lines.append(f'   Skills: {", ".join(p["skills"][:6])}')
        return "\n".join(lines)
    except Exception as e:
        return f"VECTOR SEARCH failed: {e}"


SYSTEM_PROMPT = """You are JobPulse AI Assistant, a helpful chatbot embedded in the JobPulse AI job market intelligence dashboard.

Your role:
- Answer questions about the job market data shown to you below.
- When VECTOR SEARCH RESULTS are provided, use them to answer specific questions like "how many jobs in Bangalore that suit me?"
- Cite specific numbers and job titles from the data context.
- Be concise (3-5 sentences per answer unless asked for detail).

CRITICAL SAFETY RULES (NEVER VIOLATE):
1. You CANNOT delete, modify, update, insert, drop, truncate, or wipe any data. Read-only.
2. You do NOT have SQL or database mutation access.
3. If a user asks you to delete/modify/wipe anything, refuse politely.

Data sources: 4dayweek.io (via Anakin API) + Adzuna API."""


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """RAG-powered chatbot."""
    message = req.message.strip()
    if not message:
        raise HTTPException(400, "Message is required")
    if len(message) > 1000:
        raise HTTPException(400, "Message too long (max 1000 chars)")

    # 1. Safety guard
    if is_forbidden(message):
        refusal = "I'm a read-only assistant — I can answer questions about job postings, skills, salaries, and trends, but I can't delete, modify, or wipe any data."
        db.add(ChatMessage(id=str(uuid.uuid4()), user_id=user.id, role="user", content=message))
        db.add(ChatMessage(id=str(uuid.uuid4()), user_id=user.id, role="assistant", content=refusal))
        db.commit()
        return ChatResponse(reply=refusal, refused=True, used_search=False)

    # 2. Build context
    data_context = await build_data_context(db)
    search_context = ""
    used_search = False

    if needs_search(message):
        used_search = True
        filters = extract_filters(message)
        search_context = await build_search_context(filters["search_query"], filters, user)

    # 3. Load chat history
    history = db.query(ChatMessage).filter(
        ChatMessage.user_id == user.id,
        ChatMessage.role.in_(["user", "assistant"])
    ).order_by(ChatMessage.created_at.desc()).limit(10).all()
    history.reverse()

    # 4. Build LLM messages
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": data_context},
    ]
    if search_context:
        messages.append({"role": "system", "content": search_context})

    # User profile
    skills = json.loads(user.skills or "[]")
    if skills:
        messages.append({
            "role": "system",
            "content": f"USER PROFILE: Skills = [{', '.join(skills)}], Target role = {user.target_role or 'not specified'}."
        })

    for m in history:
        messages.append({"role": m.role, "content": m.content})
    messages.append({"role": "user", "content": message})

    # 5. Save user message
    db.add(ChatMessage(id=str(uuid.uuid4()), user_id=user.id, role="user", content=message))
    db.commit()

    # 6. Call LLM
    result = call_llm(messages, temperature=0.4, max_tokens=800)
    reply = result["text"] or "I couldn't generate a response. Please try again."

    # 7. Save assistant reply
    db.add(ChatMessage(id=str(uuid.uuid4()), user_id=user.id, role="assistant", content=reply))
    db.commit()

    return ChatResponse(reply=reply, refused=False, used_search=used_search, llm_provider=result["provider"])


import uuid
