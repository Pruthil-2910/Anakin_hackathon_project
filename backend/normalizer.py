"""
Normalizer — canonicalize regions, parse salaries, derive job type, extract skills.
Equivalent to src/lib/normalizer.ts.
"""

import re

REGION_PATTERNS = [
    (r"\bUSA\b|\bUS\b|United States", "USA"),
    (r"\bUK\b|United Kingdom|\bEngland\b|\bScotland\b", "UK"),
    (r"\bCanada\b", "Canada"),
    (r"\bAustralia\b", "Australia"),
    (r"\bGermany\b", "Germany"),
    (r"\bFrance\b", "France"),
    (r"\bNetherlands\b", "Netherlands"),
    (r"\bSpain\b", "Spain"),
    (r"\bItaly\b", "Italy"),
    (r"\bIndia\b|\bBengaluru\b|\bBangalore\b|\bMumbai\b|\bDelhi\b|\bHyderabad\b|\bPune\b|\bChennai\b", "India"),
    (r"\bPhilippines\b", "Philippines"),
    (r"\bBrazil\b", "Brazil"),
    (r"\bMexico\b", "Mexico"),
    (r"\bSouth Africa\b", "South Africa"),
    (r"\bEgypt\b", "Egypt"),
    (r"\bIsrael\b", "Israel"),
    (r"\bUAE\b|United Arab Emirates|\bDubai\b", "UAE"),
    (r"\bSaudi Arabia\b", "Saudi Arabia"),
    (r"\bWorldwide\b|\bGlobal\b|Anywhere", "Worldwide"),
    (r"\bEurope\b|\bEU\b", "Europe"),
    (r"\bAsia\b|\bAPAC\b", "Asia"),
]

ROLE_FAMILY_MAP = [
    (["backend", "api", "django", "fastapi", "spring", "node", "elixir"], "Backend Engineer"),
    (["frontend", "front-end", "react", "vue", "angular"], "Frontend Engineer"),
    (["fullstack", "full stack", "full-stack"], "Fullstack Engineer"),
    (["ml", "machine learning", "ai engineer", "data scientist"], "ML/AI Engineer"),
    (["data engineer", "etl", "spark", "airflow"], "Data Engineer"),
    (["devops", "sre", "platform engineer", "cloud", "kubernetes"], "DevOps/SRE"),
    (["mobile", "android", "ios", "react native", "flutter"], "Mobile Engineer"),
    (["qa", "test", "automation"], "QA Engineer"),
    (["product manager", "program manager"], "Product/Program Manager"),
    (["design", "ux", "ui"], "Designer"),
    (["engineering manager", "head of engineering", "cto"], "Engineering Manager"),
]

SKILL_DICT = [
    "python", "javascript", "typescript", "java", "golang", "rust", "react", "angular", "vue",
    "node", "express", "django", "flask", "fastapi", "spring", "graphql", "postgresql", "postgres",
    "mysql", "mongodb", "redis", "aws", "gcp", "azure", "docker", "kubernetes", "terraform",
    "pandas", "numpy", "tensorflow", "pytorch", "spark", "airflow", "kafka", "android", "ios",
    "flutter", "git", "linux", "microservices", "elixir", "laravel", "php", "ruby", "scala", "sql",
    "html", "css", "tailwind", "redux", "kotlin", "swift", "devops", "machine learning",
]
SKILL_REGEX = re.compile("|".join(re.escape(s) for s in SKILL_DICT), re.IGNORECASE)


def canonicalize_region(raw_location: str | None) -> str:
    if not raw_location:
        return "Unknown"
    for pattern, region in REGION_PATTERNS:
        if re.search(pattern, raw_location, re.IGNORECASE):
            return region
    return "Other"


def infer_remote_type(raw_location: str | None, is_remote: bool = False) -> str:
    if raw_location:
        lower = raw_location.lower()
        if lower.startswith("remote"):
            return "remote"
        if lower.startswith("hybrid"):
            return "hybrid"
        if lower.startswith("onsite"):
            return "onsite"
    if is_remote:
        return "remote"
    return "unknown"


def derive_company_from_slug(job_id: str) -> str | None:
    no_hash = re.sub(r"-[a-f0-9]{8}$", "", job_id)
    at_idx = no_hash.find("-at-")
    if at_idx == -1:
        return None
    company_part = no_hash[at_idx + 4:]
    return " ".join(w.capitalize() for w in company_part.split("-"))


def parse_salary_from_badges(badges: list[str] | None) -> dict | None:
    if not badges:
        return None
    salary_badge = next((b for b in badges if re.search(r"[\$£€]|k\b", b, re.IGNORECASE) and re.search(r"\d", b)), None)
    if not salary_badge:
        return None
    raw = salary_badge.strip()
    currency = "USD" if "$" in raw else "GBP" if "£" in raw else "EUR" if "€" in raw else "USD"
    numbers = []
    for m in re.finditer(r"(\d+(?:\.\d+)?)(k)?", raw, re.IGNORECASE):
        val = float(m.group(1))
        numbers.append(val * 1000 if m.group(2) else val)
    if not numbers:
        return None
    return {"min": numbers[0], "max": numbers[1] if len(numbers) > 1 else None, "currency": currency, "raw": raw}


def parse_work_week_score(badges: list[str] | None) -> dict:
    if not badges:
        return {"score": None, "label": None}
    score_badge = next((b for b in badges if re.search(r"[•·]", b) and re.search(r"\d", b)), None)
    if not score_badge:
        return {"score": None, "label": None}
    parts = [p.strip() for p in re.split(r"[•·]", score_badge)]
    if len(parts) < 2:
        return {"score": None, "label": None}
    try:
        return {"score": int(parts[0]), "label": " ".join(parts[1:])}
    except ValueError:
        return {"score": None, "label": None}


def derive_role_family(title: str) -> str:
    lower = title.lower()
    for keywords, family in ROLE_FAMILY_MAP:
        if any(kw in lower for kw in keywords):
            return family
    return "Other"


def derive_job_type(title: str, badges: list[str] = None, contract_time: str = None, contract_type: str = None) -> str:
    if re.search(r"\bintern(ship)?\b|\btrainee\b", title, re.IGNORECASE):
        return "intern"
    if re.search(r"\bpart[\s-]?time\b", title, re.IGNORECASE):
        return "part-time"
    if contract_time == "part_time":
        return "part-time"
    if re.search(r"\bcontract(or|ing)?\b|\bfreelance\b", title, re.IGNORECASE):
        return "contract"
    if contract_type == "contract":
        return "contract"
    if badges and any(re.search(r"part[\s-]?time", b, re.IGNORECASE) for b in badges):
        return "part-time"
    return "full-time"


def extract_skills(text: str) -> list[str]:
    found = set()
    for m in SKILL_REGEX.finditer(text):
        c = m.group().lower()
        if c == "golang":
            found.add("go")
        elif c == "node":
            found.add("node.js")
        elif c == "postgres":
            found.add("postgresql")
        else:
            found.add(c)
    return sorted(found)
