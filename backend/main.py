"""FastAPI server. POST /run streams agent events as NDJSON."""
import json
import logging
import os
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from supabase import create_client

from agent import run_agent
from auth import get_current_user
from profile import router as profile_router

load_dotenv()
_db = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("agent-runner")

app = FastAPI(title="Agent Runner")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile_router)


class TaskRequest(BaseModel):
    task: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/run")
async def run(req: TaskRequest, user: Annotated[dict, Depends(get_current_user)]):
    """Stream agent events as NDJSON."""
    log.info("run task=%r user=%s", req.task, user.get("email"))

    async def stream():
        try:
            async for event in run_agent(req.task):
                yield json.dumps(event) + "\n"
        except Exception as e:
            log.exception("agent error")
            yield json.dumps({"type": "error", "content": str(e)}) + "\n"

    return StreamingResponse(stream(), media_type="application/x-ndjson")


@app.get("/find-jobs")
async def find_jobs(user: Annotated[dict, Depends(get_current_user)]):
    """Stream job-search agent events for the authenticated user's profile."""
    email = user.get("email")
    log.info("find-jobs email=%r", email)

    profile = None
    try:
        result = _db.table("profiles").select("*").eq("email", email).single().execute()
        profile = result.data
    except Exception:
        pass

    if not profile:
        async def no_profile():
            yield json.dumps({"type": "error", "content": "Profile not found"}) + "\n"
        return StreamingResponse(no_profile(), media_type="application/x-ndjson")

    headline   = profile.get("headline") or ""
    skills     = ", ".join((profile.get("skills") or [])[:12])
    prefs      = profile.get("job_prefs") or {}
    roles      = prefs.get("roles", "")
    locations  = prefs.get("locations", "")
    salary     = prefs.get("salary_min", "")
    industries = prefs.get("industries", "")

    system_prompt = f"""You are a job-search agent helping a candidate find real, current openings.

CANDIDATE PROFILE:
Headline: {headline}
Target roles: {roles}
Preferred locations: {locations}
Min salary: {salary}
Industries: {industries}
Skills: {skills}

INSTRUCTIONS:
1. Call search_jobs 2-3 times with targeted queries to find real, current postings that fit this profile.
2. After searching, output ONLY a valid JSON array — no markdown fences, no explanation, just the array.
3. Each element must have exactly these fields:
   role, company, location, salary, match (integer 0-100), tags (array of 2-3 strings), posted (e.g. "2d ago"), isNew (boolean)
4. Return 5-6 jobs total. If salary is unknown use an estimate based on role/company size."""

    task = (
        f"Find 5-6 current job openings for: {headline}. "
        f"Target roles: {roles}. Locations: {locations}. "
        "Return a JSON array only."
    )

    async def stream():
        try:
            async for event in run_agent(task, system_prompt=system_prompt):
                yield json.dumps(event) + "\n"
        except Exception as e:
            log.exception("find-jobs agent error")
            yield json.dumps({"type": "error", "content": str(e)}) + "\n"

    return StreamingResponse(stream(), media_type="application/x-ndjson")
