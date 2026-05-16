import os
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client

load_dotenv()
_db = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

TABLE = "profiles"
router = APIRouter()


class Profile(BaseModel):
    email: str
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


@router.post("/profile")
async def create_profile(profile: Profile):
    result = _db.table(TABLE).upsert(profile.model_dump(), on_conflict="email").execute()
    return {"status": "ok", "data": result.data[0] if result.data else {}}


@router.get("/profile/{email}")
async def read_profile(email: str):
    result = _db.table(TABLE).select("*").eq("email", email).single().execute()
    if result.data is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data
