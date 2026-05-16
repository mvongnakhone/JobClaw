"""Direct LLM job compatibility analysis — no tools, no streaming, no ReAct loop.

Called by jobs.py after new Adzuna listings are inserted.
Returns a compatibility score and ranked experience list for resume tailoring.
"""
import json
import logging
import os
import re

import httpx
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

log = logging.getLogger("analyzer")

_client = AsyncOpenAI(
    api_key=os.getenv("NVIDIA_API_KEY"),
    base_url=os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
    http_client=httpx.AsyncClient(),
)

MODEL = os.getenv("NEMOTRON_MODEL", "nvidia/nvidia-nemotron-nano-9b-v2")

_SYSTEM = """You are a resume advisor. Given a job description and a candidate's profile, you:
1. Compute a compatibility score (0–100) reflecting how well the candidate fits the role.
2. Rank ALL of the candidate's experiences, projects, and volunteering entries by relevance to the job description — most relevant first.

Respond with ONLY valid JSON — no markdown, no explanation:
{
  "compatibility_score": <integer 0-100>,
  "reasoning": "<1-2 sentences explaining the score>",
  "experience_ranking": [
    {
      "type": "experience" | "project" | "volunteering",
      "index": <0-based index in the respective array>,
      "title": "<job title, project name, or volunteer role>",
      "company_or_context": "<company, org, or project context>",
      "relevance_score": <integer 0-100>,
      "reason": "<one sentence: why this item is relevant to the job>"
    }
  ]
}

Include EVERY experience, project, and volunteering item the candidate has — even if barely relevant (score it low). The user needs this full ranked list to decide what to cut from their limited resume."""


def _format_profile(profile: dict) -> str:
    parts = []

    skills = profile.get("skills") or []
    if skills:
        parts.append(f"SKILLS: {', '.join(skills[:20])}")

    for i, exp in enumerate(profile.get("experience") or []):
        title = exp.get("title", "")
        company = exp.get("company", "")
        desc = exp.get("desc", "")
        parts.append(f"EXPERIENCE[{i}]: {title} at {company} — {desc[:300]}")

    for i, proj in enumerate(profile.get("projects") or []):
        name = proj.get("name", "")
        desc = proj.get("desc", "")
        tags = ", ".join(proj.get("tags") or [])
        parts.append(f"PROJECT[{i}]: {name} ({tags}) — {desc[:300]}")

    for i, vol in enumerate(profile.get("volunteering") or []):
        role = vol.get("role", "")
        org = vol.get("org", "")
        desc = vol.get("desc", "")
        parts.append(f"VOLUNTEERING[{i}]: {role} at {org} — {desc[:300]}")

    return "\n".join(parts) or "No experiences provided."


def _default_result() -> dict:
    return {"compatibility_score": 0, "reasoning": "Analysis unavailable.", "experience_ranking": []}


async def analyze_job(profile: dict, job: dict) -> dict:
    """Analyze one job against the user's profile. Returns structured dict."""
    title = job.get("title", "Unknown Role")
    company = job.get("company", "")
    description = (job.get("description") or "")[:1500]

    user_message = (
        f"JOB: {title} at {company}\n"
        f"DESCRIPTION:\n{description}\n\n"
        f"CANDIDATE PROFILE:\n{_format_profile(profile)}"
    )

    try:
        response = await _client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": user_message},
            ],
            temperature=0.2,
        )
        raw = response.choices[0].message.content or ""
        # Strip any accidental markdown fences
        raw = re.sub(r"^```[a-z]*\n?", "", raw.strip())
        raw = re.sub(r"\n?```$", "", raw.strip())
        result = json.loads(raw)
        # Clamp score to valid range
        result["compatibility_score"] = max(0, min(100, int(result.get("compatibility_score", 0))))
        return result
    except Exception:
        log.exception("analyze_job failed for job=%s", job.get("id") or title)
        return _default_result()
