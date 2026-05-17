import json
import logging
import os
from typing import Annotated, Any

from dotenv import load_dotenv
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client

from auth import get_current_user

load_dotenv()
_db = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

TABLE = "profiles"
router = APIRouter()
log = logging.getLogger("profile")

_EXPERIENCE_FIELDS = ("experience", "projects", "volunteering", "skills")


class Profile(BaseModel):
    name: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    headline: str | None = None
    portfolio_url: str | None = None
    twitter_url: str | None = None
    education: list[Any] = []
    experience: list[Any] = []
    projects: list[Any] = []
    skills: list[str] = []
    job_prefs: dict[str, Any] = {}
    volunteering: list[Any] = []


def _experience_changed(old: dict, new: dict) -> bool:
    for field in _EXPERIENCE_FIELDS:
        if json.dumps(old.get(field), sort_keys=True) != json.dumps(new.get(field), sort_keys=True):
            return True
    return False


async def _reanalyze_all_jobs(email: str, profile: dict) -> None:
    """Re-analyze ALL of the user's job listings with the updated profile."""
    from jobs import _run_analysis  # local import avoids circular dependency at module load
    try:
        res = (
            _db.table("job_listings")
            .select("id, adzuna_id, title, company, description")
            .eq("user_email", email)
            .execute()
        )
        all_jobs = res.data or []
        if all_jobs:
            log.info("reanalyzing %d jobs for %s after profile change", len(all_jobs), email)
            await _run_analysis(email, profile, all_jobs)
    except Exception:
        log.exception("_reanalyze_all_jobs failed for %s", email)


@router.post("/profile")
async def create_profile(
    profile: Profile,
    background_tasks: BackgroundTasks,
    user: Annotated[dict, Depends(get_current_user)],
):
    email = user["email"]

    # Fetch existing profile to detect experience-relevant changes
    old_profile: dict = {}
    try:
        res = _db.table(TABLE).select("*").eq("email", email).single().execute()
        old_profile = res.data or {}
    except Exception:
        pass

    new_data = {"email": email, **profile.model_dump()}
    result = _db.table(TABLE).upsert(new_data, on_conflict="email").execute()

    if _experience_changed(old_profile, new_data):
        log.info("experience fields changed for %s — queuing re-analysis", email)
        background_tasks.add_task(_reanalyze_all_jobs, email, new_data)

    return {"status": "ok", "data": result.data[0] if result.data else {}}


@router.get("/profile")
async def read_profile(user: Annotated[dict, Depends(get_current_user)]):
    email = user["email"]
    result = _db.table(TABLE).select("*").eq("email", email).single().execute()
    if result.data is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data
