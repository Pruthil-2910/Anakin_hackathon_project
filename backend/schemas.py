"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr, ConfigDict, Field
from pydantic.alias_generators import to_camel
from typing import Optional, List, Any
from datetime import datetime


# === Auth ===
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]

class AuthResponse(BaseModel):
    user: UserResponse
    token: str

class ProfileResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True
    )
    id: str
    email: str
    name: Optional[str]
    headline: Optional[str]
    bio: Optional[str]
    skills: List[str]
    experience_years: Optional[int]
    current_role: Optional[str]
    target_role: Optional[str]
    preferred_regions: List[str]
    preferred_remote_type: Optional[str]
    salary_expectation_min: Optional[int]
    salary_currency: Optional[str]
    resume_data: dict
    created_at: datetime

class ProfileUpdate(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True
    )
    name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = None
    current_role: Optional[str] = None
    target_role: Optional[str] = None
    preferred_regions: Optional[List[str]] = None
    preferred_remote_type: Optional[str] = None
    salary_expectation_min: Optional[int] = None
    salary_currency: Optional[str] = None
    resume_data: Optional[dict] = None


# === Postings ===
class Posting(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True
    )
    id: str
    source: str
    external_id: Optional[str]
    title: str
    company: Optional[str]
    url: Optional[str]
    application_url: Optional[str]
    raw_location: Optional[str]
    region: Optional[str]
    remote_type: str
    is_remote: bool
    skills: List[str]
    salary_min: Optional[float]
    salary_max: Optional[float]
    currency: Optional[str]
    salary_raw: Optional[str]
    work_week_score: Optional[int]
    work_week_label: Optional[str]
    experience_level: Optional[str]
    posted_date: Optional[datetime]
    category_slug: str
    job_type: str

class PostingsResponse(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int
    data: List[Posting]


# === Search ===
class SearchResult(BaseModel):
    posting: Posting
    score: float
    distance: float

class SearchResponse(BaseModel):
    query: str
    filters: dict
    count: int
    results: List[SearchResult]


# === Matches ===
class MatchBreakdown(BaseModel):
    skills_score: int
    role_score: int
    region_score: int
    remote_score: int
    salary_score: int
    matched_skills: List[str]
    missing_skills: List[str]

class MatchResult(BaseModel):
    posting: Posting
    score: int
    breakdown: MatchBreakdown
    reasons: List[str]


# === Chat ===
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    refused: bool
    used_search: bool
    llm_provider: Optional[str] = None


# === Resume ===
class ResumeData(BaseModel):
    template: str = "modern"
    contact: dict
    summary: str = ""
    experience: List[dict] = []
    education: List[dict] = []
    skills: List[str] = []


# === Saved Jobs ===
class SaveJobRequest(BaseModel):
    posting_id: str = Field(validation_alias="postingId")

class SavedJobResponse(BaseModel):
    id: str
    saved_at: datetime
    posting: Posting


# === Stats ===
class StatsResponse(BaseModel):
    total_postings: int
    recent_postings: int
    regions_covered: List[str]
    categories: List[dict]
    remote_breakdown: List[dict]
    job_type_breakdown: List[dict]
    last_ingestion: Optional[dict]

class VectorStatsResponse(BaseModel):
    postings_with_vectors: int
    total_postings: int
    coverage: int
