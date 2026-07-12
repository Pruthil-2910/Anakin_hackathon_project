"""
Semantic job matcher — weighted multi-signal scoring.
Equivalent to src/lib/matcher.ts.
"""

from normalizer import derive_role_family


def jaccard(a: set, b: set) -> float:
    if not a and not b:
        return 0
    intersection = len(a & b)
    union = len(a | b)
    return intersection / union if union > 0 else 0


def score_match(profile: dict, posting: dict) -> dict:
    """Compute a match score between user profile and posting."""
    user_skills = set(s.lower() for s in profile.get("skills", []))
    posting_skills = set(s.lower() for s in posting.get("skills", []))

    # Skills (40%)
    matched_skills = list(user_skills & posting_skills)
    missing_skills = list(posting_skills - user_skills)
    skills_jaccard = jaccard(user_skills, posting_skills)
    skills_score = 50 if not user_skills else skills_jaccard * 100

    # Role family (25%)
    posting_family = derive_role_family(posting["title"])
    target = profile.get("target_role")
    if not target:
        role_score = 50
    elif target == posting_family:
        role_score = 100
    elif target.lower() in posting_family.lower() or posting_family.lower() in target.lower():
        role_score = 60
    else:
        role_score = 0

    # Region (15%)
    preferred_regions = profile.get("preferred_regions", [])
    if not preferred_regions:
        region_score = 50
    elif posting.get("region") in preferred_regions:
        region_score = 100
    elif posting.get("region") in ("Worldwide", "Remote"):
        region_score = 70
    else:
        region_score = 0

    # Remote (10%)
    pref_remote = profile.get("preferred_remote_type")
    if not pref_remote:
        remote_score = 50
    elif pref_remote == posting.get("remote_type"):
        remote_score = 100
    elif posting.get("remote_type") == "remote":
        remote_score = 60
    else:
        remote_score = 0

    # Salary (10%)
    salary_min = profile.get("salary_expectation_min")
    if not salary_min:
        salary_score = 50
    elif posting.get("salary_min") and posting["salary_min"] >= salary_min:
        salary_score = 100
    elif posting.get("salary_max") and posting["salary_max"] >= salary_min:
        salary_score = 70
    elif posting.get("salary_min"):
        salary_score = max(0, (posting["salary_min"] / salary_min) * 60)
    else:
        salary_score = 30

    score = round(
        skills_score * 0.4 + role_score * 0.25 + region_score * 0.15 +
        remote_score * 0.1 + salary_score * 0.1
    )

    # Build reasons
    reasons = []
    if matched_skills:
        reasons.append(f"Matches {len(matched_skills)} of your skills: {', '.join(matched_skills[:5])}")
    if target and target == posting_family:
        reasons.append(f"Role family ({posting_family}) matches your target")
    if preferred_regions and posting.get("region") in preferred_regions:
        reasons.append(f"Located in {posting['region']} (one of your preferred regions)")
    if pref_remote and pref_remote == posting.get("remote_type"):
        reasons.append(f"Work mode ({posting['remote_type']}) matches your preference")
    if salary_min and posting.get("salary_min") and posting["salary_min"] >= salary_min:
        reasons.append("Salary meets your minimum expectation")
    if not reasons:
        reasons.append("Limited profile data — fill out your profile for better matches")

    return {
        "posting": posting,
        "score": score,
        "breakdown": {
            "skillsScore": round(skills_score),
            "roleScore": round(role_score),
            "regionScore": round(region_score),
            "remoteScore": round(remote_score),
            "salaryScore": round(salary_score),
            "matchedSkills": matched_skills,
            "missingSkills": missing_skills[:8],
        },
        "reasons": reasons,
    }
