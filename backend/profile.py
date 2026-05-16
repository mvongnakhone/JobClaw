import os
from typing import Annotated, Any

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client

from auth import get_current_user

load_dotenv()
_db = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

TABLE = "profiles"
router = APIRouter()


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


@router.post("/profile")
async def create_profile(
    profile: Profile,
    user: Annotated[dict, Depends(get_current_user)],
):
    email = user["email"]
    data = {"email": email, **profile.model_dump()}
    result = _db.table(TABLE).upsert(data, on_conflict="email").execute()
    return {"status": "ok", "data": result.data[0] if result.data else {}}


@router.get("/profile")
async def read_profile(user: Annotated[dict, Depends(get_current_user)]):
    email = user["email"]
    result = _db.table(TABLE).select("*").eq("email", email).single().execute()
    if result.data is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data
