import os, json, re, httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)

app = FastAPI(title="CareerCompass AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten to your Vercel URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Gemini helper ──────────────────────────────────────────────────────────────

async def call_gemini(system: str, user: str) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(500, "GEMINI_API_KEY not configured on server.")
    prompt = f"{system}\n\n{user}\n\nReturn ONLY valid JSON. No markdown, no backticks, no commentary."
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            GEMINI_URL,
            headers={"x-goog-api-key": GEMINI_API_KEY},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.7,
                    "responseMimeType": "application/json",
                },
            },
        )
    if resp.status_code == 429:
        raise HTTPException(429, "Rate limit hit — please retry in a moment.")
    if not resp.ok:
        raise HTTPException(resp.status_code, f"Gemini error: {resp.text[:200]}")

    data = resp.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    return text


def parse_json(text: str) -> dict:
    """Strip markdown fences if Gemini adds them, then parse."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            return json.loads(match.group())
        raise HTTPException(500, "AI returned unparseable JSON.")


# ── 1. Generate Roadmap ───────────────────────────────────────────────────────

class RoadmapRequest(BaseModel):
    resume: str = Field(..., min_length=20)
    role: str = Field(..., min_length=2)
    timeline: str = Field("90", pattern="^(30|60|90)$")


@app.post("/api/roadmap")
async def generate_roadmap(req: RoadmapRequest):
    phase_list = (
        '["30"]' if req.timeline == "30"
        else '["30","60"]' if req.timeline == "60"
        else '["30","60","90"]'
    )
    system = (
        "You are CareerCompass AI — a pragmatic career mentor. "
        "Given a user's resume/skills and a target role, produce a JSON career roadmap. "
        "Be specific, not generic. Tailor everything to the user's stated background. "
        "Favor FREE resources (freeCodeCamp, MDN, docs, YouTube, Coursera audit, Kaggle). "
        "Each weekly task must be concrete and verb-led (Build X, Read Y, Apply to Z). "
        "Be honest about gaps; don't pad strengths."
    )
    user = f"""TARGET ROLE: {req.role}
TIMELINE: {req.timeline} days
PHASES TO GENERATE: {phase_list}

USER RESUME / SKILLS:
\"\"\"
{req.resume}
\"\"\"

Return JSON with this exact shape:
{{
  "role": string,
  "summary": "2-3 sentence honest assessment of where the user stands for this role.",
  "strengths": [string],
  "gaps": [ {{ "skill": string, "priority": "high"|"medium"|"low", "why": string }} ],
  "phases": [
    {{
      "phase": "30"|"60"|"90",
      "title": string,
      "summary": string,
      "weeks": [
        {{
          "week": number,
          "focus": string,
          "tasks": [
            {{ "title": string, "detail": string, "resource": {{ "label": string, "url": string }} }}
          ]
        }}
      ]
    }}
  ],
  "resources": [ {{ "label": string, "url": string, "topic": string }} ]
}}"""
    text = await call_gemini(system, user)
    return parse_json(text)


# ── 2. Interview Questions ────────────────────────────────────────────────────

class InterviewRequest(BaseModel):
    resume: str = Field(..., min_length=20)
    role: str = Field(..., min_length=2)


@app.post("/api/interview")
async def generate_interview(req: InterviewRequest):
    system = "You are a senior tech interviewer. Generate role-specific questions tailored to the candidate's resume."
    user = f"""ROLE: {req.role}
RESUME: \"\"\"{req.resume}\"\"\"

Return JSON:
{{
  "role": string,
  "questions": [
    {{
      "question": string,
      "type": "behavioral"|"technical"|"system-design"|"role-fit",
      "whyAsked": string,
      "answerOutline": string
    }}
  ]
}}
Exactly 5 questions, mix of types, calibrated to the resume level."""
    text = await call_gemini(system, user)
    return parse_json(text)


# ── 3. GitHub Project Ideas ───────────────────────────────────────────────────

class ProjectsRequest(BaseModel):
    role: str = Field(..., min_length=2)
    gaps: list[str] = Field(..., min_length=1)


@app.post("/api/projects")
async def suggest_projects(req: ProjectsRequest):
    system = "You suggest GitHub portfolio project ideas that fill specific skill gaps. Be concrete and practical."
    user = f"""TARGET ROLE: {req.role}
SKILL GAPS TO FILL: {", ".join(req.gaps)}

Return JSON:
{{
  "ideas": [
    {{
      "title": string,
      "difficulty": "beginner"|"intermediate"|"advanced",
      "skillsCovered": [string],
      "description": string,
      "features": [string],
      "stretchGoal": string
    }}
  ]
}}
Exactly 3 ideas, each filling 1-3 of the listed gaps."""
    text = await call_gemini(system, user)
    return parse_json(text)


# ── 4. ATS Analysis ───────────────────────────────────────────────────────────

class AtsRequest(BaseModel):
    resume: str = Field(..., min_length=20)
    role: str = Field(..., min_length=2)


@app.post("/api/ats")
async def analyze_ats(req: AtsRequest):
    system = "You are an ATS resume reviewer. Identify weak verbs/phrases and suggest stronger replacements for the given role."
    user = f"""TARGET ROLE: {req.role}
RESUME: \"\"\"{req.resume}\"\"\"

Return JSON:
{{
  "score": number,
  "missingKeywords": [string],
  "weakPhrases": [
    {{ "weak": string, "suggested": string, "why": string }}
  ],
  "tips": [string]
}}
score is 0-100. 5-10 missingKeywords. 4-7 weakPhrases. 3-5 tips."""
    text = await call_gemini(system, user)
    return parse_json(text)


# ── 5. Career Comparison ──────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    roleA: str = Field(..., min_length=2)
    roleB: str = Field(..., min_length=2)


@app.post("/api/compare")
async def compare_careers(req: CompareRequest):
    system = "You compare careers honestly using current market knowledge. Salaries are US averages; use ranges like '$95k-$130k'."
    user = f"""Compare these two careers: "{req.roleA}" vs "{req.roleB}".

Return JSON:
{{
  "a": {{
    "role": string, "oneLiner": string, "coreSkills": [string],
    "avgSalaryUsd": string, "timeToReadyMonths": number,
    "dailyWork": string, "prosCons": {{ "pros": [string], "cons": [string] }}
  }},
  "b": {{ same shape as a }},
  "verdict": string
}}"""
    text = await call_gemini(system, user)
    return parse_json(text)


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "CareerCompass AI backend running", "version": "2.0.0"}

@app.get("/debug")
def debug():
    key = os.getenv("GEMINI_API_KEY", "NOT SET")
    return {"key_set": bool(key), "key_preview": key[:10] + "..." if key else "empty"}

