"""Adzuna job fetching, storage, and background polling."""
import logging
import os
import re

import httpx
from fastapi import APIRouter, Depends
from supabase import create_client
from typing import Annotated

from auth import get_current_user

log = logging.getLogger("jobs")
_db = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

router = APIRouter(prefix="/jobs", tags=["jobs"])

ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs"


def _parse_salary(s: str) -> int | None:
    if not s:
        return None
    clean = s.lower().replace("k", "000").replace(",", "").replace("$", "")
    m = re.search(r"\d+", clean)
    return int(m.group()) if m else None


def _build_params(profile: dict) -> dict:
    prefs = profile.get("job_prefs") or {}
    what = prefs.get("roles") or profile.get("headline") or ""
    locations = prefs.get("locations") or profile.get("location") or ""
    where = locations.split(",")[0].strip()
    salary_min = _parse_salary(prefs.get("salary_min", ""))

    contract_map = {
        "full-time": "permanent", "full time": "permanent",
        "contract": "contract",
        "part-time": "part_time", "part time": "part_time",
    }
    job_type = (prefs.get("job_type") or "").lower()
    contract = contract_map.get(job_type)

    params = {
        "app_id": os.environ.get("ADZUNA_APP_ID", ""),
        "app_key": os.environ.get("ADZUNA_APP_KEY", ""),
        "what": what,
        "results_per_page": 10,
        "max_days_old": 7,
        "sort_by": "date",
    }
    if where:
        params["where"] = where
    if salary_min:
        params["salary_min"] = salary_min
    if contract:
        params["contract_type"] = contract
    return params


async def _fetch_adzuna(profile: dict, country: str = "us") -> list[dict]:
    if not os.environ.get("ADZUNA_APP_ID") or not os.environ.get("ADZUNA_APP_KEY"):
        log.warning("ADZUNA_APP_ID or ADZUNA_APP_KEY not configured — skipping Adzuna fetch")
        return []
    url = f"{ADZUNA_BASE}/{country}/search/1"
    params = _build_params(profile)
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(url, params=params)
        r.raise_for_status()
        return r.json().get("results", [])


def _to_row(result: dict, email: str) -> dict:
    return {
        "user_email": email,
        "adzuna_id": result["id"],
        "title": result.get("title", ""),
        "company": (result.get("company") or {}).get("display_name", ""),
        "location": (result.get("location") or {}).get("display_name", ""),
        "salary_min": result.get("salary_min"),
        "salary_max": result.get("salary_max"),
        "description": (result.get("description") or "")[:1000],
        "redirect_url": result.get("redirect_url", ""),
        "category": (result.get("category") or {}).get("label", ""),
        "contract_type": result.get("contract_type", ""),
    }


async def fetch_and_store(email: str, profile: dict) -> int:
    """Fetch from Adzuna, persist new listings, return count of new rows inserted."""
    results = await _fetch_adzuna(profile)
    if not results:
        return 0

    existing = _db.table("job_listings").select("adzuna_id").eq("user_email", email).execute()
    seen = {row["adzuna_id"] for row in (existing.data or [])}

    new_rows = [_to_row(r, email) for r in results if r["id"] not in seen]
    if new_rows:
        _db.table("job_listings").insert(new_rows).execute()
    log.info("fetch_and_store email=%s new=%d", email, len(new_rows))
    return len(new_rows)


async def poll_all_users() -> None:
    """Scheduled task: poll Adzuna for every user that has job preferences set."""
    try:
        res = _db.table("profiles").select("email, headline, location, skills, job_prefs").execute()
        for profile in res.data or []:
            email = profile.get("email")
            if email and profile.get("job_prefs"):
                await fetch_and_store(email, profile)
    except Exception:
        log.exception("poll_all_users error")


@router.get("")
async def list_jobs(user: Annotated[dict, Depends(get_current_user)]):
    """Return stored job listings for the current user, newest first."""
    res = (
        _db.table("job_listings")
        .select("*")
        .eq("user_email", user["email"])
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return res.data or []


@router.post("/refresh")
async def refresh_jobs(user: Annotated[dict, Depends(get_current_user)]):
    """Trigger an immediate Adzuna fetch for the current user."""
    email = user["email"]
    res = _db.table("profiles").select("*").eq("email", email).single().execute()
    profile = res.data
    if not profile:
        return {"new": 0, "error": "profile not found"}
    new_count = await fetch_and_store(email, profile)
    return {"new": new_count}
