"""
Smart Resume Screening - Python AI Service
FastAPI + PyMuPDF + python-docx + AIML-style pattern matching
"""

import re
import json
import logging
from pathlib import Path

import fitz  # PyMuPDF
import docx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(title="Resume AI Service", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# AIML-style pattern bank
# ---------------------------------------------------------------------------
SKILL_PATTERNS = {
    # Languages
    "python": r"\bpython\b",
    "java": r"\bjava\b(?!script)",
    "javascript": r"\bjavascript\b|\bjs\b",
    "typescript": r"\btypescript\b|\bts\b",
    "c++": r"\bc\+\+\b|\bcpp\b",
    "c#": r"\bc#\b|\bcsharp\b",
    "go": r"\bgolang\b|\b(?<!\w)go(?!\w)\b",
    "rust": r"\brust\b",
    "kotlin": r"\bkotlin\b",
    "swift": r"\bswift\b",
    "scala": r"\bscala\b",
    "r": r"\br programming\b|\blanguage r\b",
    "sql": r"\bsql\b",
    # Frameworks / Libs
    "spring boot": r"\bspring\s*boot\b",
    "spring": r"\bspring\b",
    "react": r"\breact\b|\breact\.js\b",
    "angular": r"\bangular\b",
    "vue": r"\bvue\b|\bvue\.js\b",
    "node.js": r"\bnode\.js\b|\bnodejs\b",
    "fastapi": r"\bfastapi\b",
    "django": r"\bdjango\b",
    "flask": r"\bflask\b",
    "tensorflow": r"\btensorflow\b",
    "pytorch": r"\bpytorch\b",
    "scikit-learn": r"\bscikit[- ]?learn\b|\bsklearn\b",
    "machine learning": r"\bmachine\s+learning\b|\bml\b",
    "deep learning": r"\bdeep\s+learning\b",
    "nlp": r"\bnlp\b|\bnatural\s+language\s+processing\b",
    "docker": r"\bdocker\b",
    "kubernetes": r"\bkubernetes\b|\bk8s\b",
    "aws": r"\baws\b|\bamazon\s+web\s+services\b",
    "gcp": r"\bgcp\b|\bgoogle\s+cloud\b",
    "azure": r"\bazure\b",
    "redis": r"\bredis\b",
    "kafka": r"\bkafka\b",
    "postgresql": r"\bpostgres(?:ql)?\b",
    "mysql": r"\bmysql\b",
    "mongodb": r"\bmongodb\b",
    "rest api": r"\brest\s*api\b|\brestful\b",
    "graphql": r"\bgraphql\b",
    "git": r"\bgit\b",
    "ci/cd": r"\bci/cd\b|\bcicd\b|\bcontinuous\s+integration\b",
    "junit": r"\bjunit\b",
    "maven": r"\bmaven\b",
    "gradle": r"\bgradle\b",
    "html": r"\bhtml\b",
    "css": r"\bcss\b",
    "redux": r"\bredux\b",
    "jest": r"\bjest\b",
    "webpack": r"\bwebpack\b",
    "microservices": r"\bmicroservices?\b",
    "agile": r"\bagile\b|\bscrum\b",
}

DEGREE_PATTERNS = {
    "phd":       r"\bph\.?d\b|\bdoctor(?:ate|al)\b",
    "masters":   r"\bm\.?s\.?\b|\bm\.?e\.?\b|\bmasters?\b|\bmba\b|\bm\.?tech\b",
    "bachelors": r"\bb\.?s\.?\b|\bb\.?e\.?\b|\bb\.?tech\b|\bbachelor\b",
    "diploma":   r"\bdiploma\b|\bassociate\b",
}

EXPERIENCE_PATTERN = re.compile(
    r"(\d+(?:\.\d+)?)\s*\+?\s*years?\s+(?:of\s+)?(?:work\s+)?experience",
    re.IGNORECASE,
)

CONTACT_PATTERNS = {
    "email":    re.compile(r"[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}", re.IGNORECASE),
    "phone":    re.compile(r"(?:\+?\d[\d\s\-().]{7,}\d)"),
    "linkedin": re.compile(r"linkedin\.com/in/[\w\-]+", re.IGNORECASE),
}


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class JobDetails(BaseModel):
    title: str
    required_skills: str          # comma-separated
    preferred_skills: str = ""
    min_experience: int = 0
    education_level: str = "BACHELORS"
    keywords: str = ""
    shortlist_threshold: int = 70


class ParseRequest(BaseModel):
    file_path: str


class ScreenRequest(BaseModel):
    file_path: str
    job: JobDetails


class BulkScreenRequest(BaseModel):
    file_paths: list[str]
    job: JobDetails


# ---------------------------------------------------------------------------
# Parsers
# ---------------------------------------------------------------------------
def extract_text_pdf(path: str) -> str:
    doc = fitz.open(path)
    return "\n".join(page.get_text() for page in doc)


def extract_text_docx(path: str) -> str:
    doc = docx.Document(path)
    return "\n".join(p.text for p in doc.paragraphs)


def extract_text(path: str) -> str:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"File not found: {path}")
    ext = p.suffix.lower()
    if ext == ".pdf":
        return extract_text_pdf(path)
    elif ext in (".docx", ".doc"):
        return extract_text_docx(path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def parse_contact(text: str) -> dict:
    email    = CONTACT_PATTERNS["email"].search(text)
    phone    = CONTACT_PATTERNS["phone"].search(text)
    linkedin = CONTACT_PATTERNS["linkedin"].search(text)

    # Improved name extraction: 
    # Check the first few lines for something that looks like a name.
    # Exclude common resume headers and keywords.
    name = ""
    bad_keywords = {"resume", "curriculum", "vitae", "skills", "experience", "education", 
                    "profile", "summary", "project", "university", "college", "platform", 
                    "personal", "details", "contact", "technical", "objective", "work"}
    
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines[:15]:  # Look at the first 15 non-empty lines
        # Ignore lines with common bad keywords
        line_lower = line.lower()
        if any(bad in line_lower for bad in bad_keywords):
            continue
            
        # Count words, typically names are 2 to 4 words
        words = line.split()
        if 2 <= len(words) <= 4:
            # Check if line contains only letters, spaces, periods, or dashes
            if re.match(r"^[A-Za-z\s\.\-]+$", line):
                name = line
                break
                
    return {
        "name":     name,
        "email":    email.group() if email else "",
        "phone":    phone.group().strip() if phone else "",
        "linkedin": linkedin.group() if linkedin else "",
    }


def detect_skills(text: str) -> list[str]:
    lower = text.lower()
    found = []
    for skill, pattern in SKILL_PATTERNS.items():
        if re.search(pattern, lower):
            found.append(skill)
    return found


def detect_education(text: str) -> str:
    lower = text.lower()
    for degree, pattern in DEGREE_PATTERNS.items():
        if re.search(pattern, lower):
            return degree.upper()
    return "UNKNOWN"


def detect_experience(text: str) -> float:
    m = EXPERIENCE_PATTERN.search(text)
    if m:
        return float(m.group(1))
    # Count distinct year ranges like "2018 – 2022"
    ranges = re.findall(r"(20\d{2}|19\d{2})\s*[-–—]\s*(20\d{2}|present|current)", text, re.IGNORECASE)
    total = 0.0
    for start, end in ranges:
        s = int(start)
        e = 2024 if end.lower() in ("present", "current") else int(end)
        total += max(0, e - s)
    return round(total, 1) if total else 0.0


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------
EDUCATION_WEIGHTS = {"PHD": 1.0, "MASTERS": 0.9, "BACHELORS": 0.8, "DIPLOMA": 0.6, "UNKNOWN": 0.5}


def score_skills(candidate_skills: list[str], required: str, preferred: str) -> tuple[float, list[str]]:
    req_list  = [s.strip().lower() for s in required.split(",") if s.strip()]
    pref_list = [s.strip().lower() for s in preferred.split(",") if s.strip()]
    cand_set  = {s.lower() for s in candidate_skills}

    matched_req  = [s for s in req_list  if s in cand_set]
    matched_pref = [s for s in pref_list if s in cand_set]

    req_score  = (len(matched_req)  / len(req_list))  * 70 if req_list  else 70
    pref_score = (len(matched_pref) / len(pref_list)) * 30 if pref_list else 30

    return round(req_score + pref_score, 2), matched_req + matched_pref


def score_experience(years: float, min_exp: int) -> float:
    if min_exp == 0:
        return 100.0
    if years >= min_exp:
        return min(100.0, round(60 + (years / min_exp) * 40, 2))
    return round((years / min_exp) * 60, 2)


def score_education(candidate_level: str, required_level: str) -> float:
    cw = EDUCATION_WEIGHTS.get(candidate_level, 0.5)
    rw = EDUCATION_WEIGHTS.get(required_level.upper(), 0.8)
    return min(100.0, round((cw / rw) * 100, 2))


def score_keywords(text: str, keywords: str) -> float:
    if not keywords.strip():
        return 100.0
    kws   = [k.strip().lower() for k in keywords.split(",") if k.strip()]
    lower = text.lower()
    found = sum(1 for k in kws if k in lower)
    return min(100.0, round((found / len(kws)) * 150, 2))


def compute_overall(skills: float, exp: float, edu: float, kw: float) -> float:
    return round(skills * 0.40 + exp * 0.30 + edu * 0.15 + kw * 0.15, 2)


def generate_summary(contact: dict, skills: list[str], years: float, edu: str,
                      overall: float, job_title: str, shortlisted: bool) -> str:
    name = contact["name"] or "The candidate"
    verdict = "is a strong match" if shortlisted else "may not fully meet the requirements"
    return (
        f"{name} {verdict} for the {job_title} role with an overall score of {overall:.0f}/100. "
        f"They have approximately {years:.1f} years of experience and a {edu.lower()} degree. "
        f"Matched skills include: {', '.join(skills[:8]) or 'none detected'}."
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "service": "resume-ai"}


@app.post("/parse")
def parse_resume(req: ParseRequest):
    try:
        text    = extract_text(req.file_path)
        contact = parse_contact(text)
        skills  = detect_skills(text)
        edu     = detect_education(text)
        years   = detect_experience(text)
        return {
            "success": True,
            "contact": contact,
            "skills":  skills,
            "education_level": edu,
            "years_experience": years,
            "raw_text_length": len(text),
        }
    except Exception as e:
        logger.error(f"Parse error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/screen")
def screen_resume(req: ScreenRequest):
    try:
        text    = extract_text(req.file_path)
        contact = parse_contact(text)
        skills  = detect_skills(text)
        edu     = detect_education(text)
        years   = detect_experience(text)

        j = req.job
        skills_score, matched = score_skills(skills, j.required_skills, j.preferred_skills)
        exp_score  = score_experience(years, j.min_experience)
        edu_score  = score_education(edu, j.education_level)
        kw_score   = score_keywords(text, j.keywords)
        overall    = compute_overall(skills_score, exp_score, edu_score, kw_score)
        shortlisted = overall >= j.shortlist_threshold
        summary    = generate_summary(contact, matched, years, edu, overall, j.title, shortlisted)

        return {
            "success":          True,
            "candidate_name":   contact["name"],
            "candidate_email":  contact["email"],
            "candidate_phone":  contact["phone"],
            "candidate_linkedin": contact["linkedin"],
            "skills_score":     skills_score,
            "experience_score": exp_score,
            "education_score":  edu_score,
            "keyword_score":    kw_score,
            "overall_score":    overall,
            "matched_skills":   json.dumps(matched),
            "years_experience": years,
            "education_level":  edu,
            "ai_summary":       summary,
            "shortlisted":      shortlisted,
        }
    except Exception as e:
        logger.error(f"Screen error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/bulk-screen")
def bulk_screen(req: BulkScreenRequest):
    results = []
    for fp in req.file_paths:
        try:
            r = screen_resume(ScreenRequest(file_path=fp, job=req.job))
            r["file_path"] = fp
            results.append(r)
        except Exception as e:
            results.append({"file_path": fp, "success": False, "error": str(e)})
    results.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
    return {"results": results, "total": len(results)}
