import os, json, re, httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

app = FastAPI(title="CareerCompass AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def call_ai(system: str, user: str) -> str:
    if not GROQ_API_KEY:
        raise HTTPException(500, "GROQ_API_KEY not configured on server.")
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": system + " Return ONLY valid JSON. No markdown, no backticks."},
                    {"role": "user", "content": user}
                ],
                "temperature": 0.7,
                "max_tokens": 4000,
            },
        )
    if resp.status_code == 429:
        raise HTTPException(429, "Rate limit hit - please retry in a moment.")
    if not resp.is_success:
        raise HTTPException(resp.status_code, f"AI error: {resp.text[:200]}")
    data = resp.json()
    return data["choices"][0]["message"]["content"]

def parse_json(text: str) -> dict:
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

class RoadmapRequest(BaseModel):
    resume: str = Field(..., min_length=20)
    role: str = Field(..., min_length=2)
    timeline: str = Field("90", pattern="^(30|60|90)$")

@app.post("/api/roadmap")
async def generate_roadmap(req: RoadmapRequest):
    system = "You are CareerCompass AI — a pragmatic career mentor. Given a user resume and target role, produce a JSON career roadmap. Be specific and honest."
    user = f"""TARGET ROLE: {req.role}
TIMELINE: {req.timeline} days
RESUME: \"\"\"{req.resume}\"\"\"

Return JSON:
{{
  "role": string,
  "summary": string,
  "strengths": [string],
  "gaps": [{{"skill": string, "priority": "high"|"medium"|"low", "why": string}}],
  "phases": [{{
    "phase": "30"|"60"|"90",
    "title": string,
    "summary": string,
    "weeks": [{{
      "week": number,
      "focus": string,
      "tasks": [{{"title": string, "detail": string, "resource": {{"label": string, "url": string}}}}]
    }}]
  }}],
  "resources": [{{"label": string, "url": string, "topic": string}}]
}}"""
    text = await call_ai(system, user)
    return parse_json(text)

class InterviewRequest(BaseModel):
    resume: str = Field(..., min_length=20)
    role: str = Field(..., min_length=2)

@app.post("/api/interview")
async def generate_interview(req: InterviewRequest):
    system = "You are a senior tech interviewer. Generate role-specific interview questions tailored to the candidate resume."
    user = f"""ROLE: {req.role}
RESUME: \"\"\"{req.resume}\"\"\"
Return JSON: {{"role": string, "questions": [{{"question": string, "type": "behavioral"|"technical"|"system-design"|"role-fit", "whyAsked": string, "answerOutline": string}}]}}
Exactly 5 questions."""
    text = await call_ai(system, user)
    return parse_json(text)

class ProjectsRequest(BaseModel):
    role: str = Field(..., min_length=2)
    gaps: list[str] = Field(..., min_length=1)

@app.post("/api/projects")
async def suggest_projects(req: ProjectsRequest):
    system = "You suggest GitHub portfolio project ideas that fill specific skill gaps."
    user = f"""TARGET ROLE: {req.role}
SKILL GAPS: {", ".join(req.gaps)}
Return JSON: {{"ideas": [{{"title": string, "difficulty": "beginner"|"intermediate"|"advanced", "skillsCovered": [string], "description": string, "features": [string], "stretchGoal": string}}]}}
Exactly 3 ideas."""
    text = await call_ai(system, user)
    return parse_json(text)

class AtsRequest(BaseModel):
    resume: str = Field(..., min_length=20)
    role: str = Field(..., min_length=2)

@app.post("/api/ats")
async def analyze_ats(req: AtsRequest):
    system = "You are an ATS resume reviewer. Identify weak phrases and suggest stronger replacements."
    user = f"""TARGET ROLE: {req.role}
RESUME: \"\"\"{req.resume}\"\"\"
Return JSON: {{"score": number, "missingKeywords": [string], "weakPhrases": [{{"weak": string, "suggested": string, "why": string}}], "tips": [string]}}"""
    text = await call_ai(system, user)
    return parse_json(text)

class CompareRequest(BaseModel):
    roleA: str = Field(..., min_length=2)
    roleB: str = Field(..., min_length=2)

@app.post("/api/compare")
async def compare_careers(req: CompareRequest):
    system = "You compare careers honestly. Salaries are US averages."
    user = f"""Compare: "{req.roleA}" vs "{req.roleB}"
Return JSON: {{"a": {{"role": string, "oneLiner": string, "coreSkills": [string], "avgSalaryUsd": string, "timeToReadyMonths": number, "dailyWork": string, "prosCons": {{"pros": [string], "cons": [string]}}}}, "b": {{same}}, "verdict": string}}"""
    text = await call_ai(system, user)
    return parse_json(text)

@app.get("/")
def root():
    return {"status": "CareerCompass AI backend running", "version": "2.0.0"}

@app.get("/debug")
def debug():
    key = os.getenv("GROQ_API_KEY", "NOT SET")
    return {"key_set": bool(key), "key_preview": key[:10] + "..." if key else "empty"}

