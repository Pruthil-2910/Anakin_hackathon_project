"""
SQLAlchemy ORM models — mirrors the Prisma schema.
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Posting(Base):
    __tablename__ = "postings"

    id = Column(String, primary_key=True, index=True)
    source = Column(String, nullable=False)  # '4dayweek' | 'adzuna'
    external_id = Column(String)
    title = Column(String, nullable=False)
    company = Column(String)
    url = Column(String)
    application_url = Column(String)
    raw_location = Column(String)
    region = Column(String, index=True)
    remote_type = Column(String)  # 'remote' | 'hybrid' | 'onsite' | 'unknown'
    is_remote = Column(Boolean, default=False)
    skills = Column(Text, default="[]")  # JSON array
    salary_min = Column(Float)
    salary_max = Column(Float)
    currency = Column(String)
    salary_raw = Column(String)
    work_week_score = Column(Integer)
    work_week_label = Column(String)
    experience_level = Column(String)
    posted_date = Column(DateTime)
    scraped_at = Column(DateTime, default=datetime.utcnow)
    category_slug = Column(String, index=True)
    job_type = Column(String, default="full-time", index=True)  # 'full-time' | 'part-time' | 'intern' | 'contract'
    content_hash = Column(String, unique=True, index=True)

    saved_by = relationship("SavedJob", back_populates="posting")


class SkillTrend(Base):
    __tablename__ = "skill_trends"

    id = Column(String, primary_key=True)
    skill = Column(String, nullable=False)
    week_start = Column(DateTime, nullable=False)
    mention_count = Column(Integer, nullable=False)
    pct_change_wow = Column(Float)

    __table_args__ = (
        Index("idx_skill_week", "skill", "week_start", unique=True),
    )


class SalaryByRegion(Base):
    __tablename__ = "salary_by_region"

    id = Column(String, primary_key=True)
    region = Column(String, nullable=False)
    role_family = Column(String, nullable=False)
    week_start = Column(DateTime, nullable=False)
    median_salary_min = Column(Float)
    median_salary_max = Column(Float)
    sample_size = Column(Integer)

    __table_args__ = (
        Index("idx_region_role_week", "region", "role_family", "week_start", unique=True),
    )


class IngestionLog(Base):
    __tablename__ = "ingestion_logs"

    id = Column(String, primary_key=True)
    source = Column(String)
    category = Column(String)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime)
    fetched = Column(Integer, default=0)
    inserted = Column(Integer, default=0)
    skipped = Column(Integer, default=0)
    error = Column(Text)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String)
    password = Column(String, nullable=False)  # bcrypt hash
    created_at = Column(DateTime, default=datetime.utcnow)

    # Profile fields
    headline = Column(String)
    bio = Column(Text)
    skills = Column(Text, default="[]")  # JSON array
    experience_years = Column(Integer)
    current_role = Column(String)
    target_role = Column(String)
    preferred_regions = Column(Text, default="[]")  # JSON array
    preferred_remote_type = Column(String)
    salary_expectation_min = Column(Integer)
    salary_currency = Column(String)

    # Resume data
    resume_data = Column(Text, default="{}")  # JSON

    saved_jobs = relationship("SavedJob", back_populates="user", cascade="all, delete-orphan")
    chats = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")


class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    posting_id = Column(String, ForeignKey("postings.id", ondelete="CASCADE"), nullable=False)
    saved_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved_jobs")
    posting = relationship("Posting", back_populates="saved_by")

    __table_args__ = (
        Index("idx_user_posting", "user_id", "posting_id", unique=True),
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # 'user' | 'assistant' | 'system'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chats")

    __table_args__ = (
        Index("idx_user_created", "user_id", "created_at"),
    )
