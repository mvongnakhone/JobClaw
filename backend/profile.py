"""Profile model and Supabase CRUD helpers."""
from typing import Any
from pydantic import BaseModel
from db import supabase_client

TABLE = "profiles"


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


def save_profile(profile: Profile) -> dict:
    data = profile.model_dump()
    result = (
        supabase_client.table(TABLE)
        .upsert(data, on_conflict="email")
        .execute()
    )
    return result.data[0] if result.data else {}


def get_profile(email: str) -> dict | None:
    result = (
        supabase_client.table(TABLE)
        .select("*")
        .eq("email", email)
        .single()
        .execute()
    )
    return result.data
