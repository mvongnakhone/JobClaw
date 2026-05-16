"""Direct LLM job compatibility analysis — no tools, no streaming, no ReAct loop.

Called by jobs.py after new Adzuna listings are inserted.
Uses batch prompts: one LLM call per group of 8 jobs instead of one call per job.
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

_BATCH_SYSTEM = """You are a resume advisor. You will receive a candidate's profile and a numbered list of jobs.
For EACH job analyze fit and rank the candidate's experiences by relevance.

Output ONLY a valid JSON array — no markdown fences, no explanation. One element per job, in the same order:
[
  {
    "job_index": 0,
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
]

Include EVERY experience, project, and volunteering entry in each job's experience_ranking, even if barely relevant."""


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


def _strip_fences(raw: str) -> str:
    raw = raw.strip()
    raw = re.sub(r"^```[a-z]*\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)
    return raw.strip()


async def _analyze_chunk(profile_text: str, chunk: list[dict]) -> list[dict]:
    """One LLM call for a batch of jobs. Returns results in the same order as chunk."""
    job_lines = []
    for i, job in enumerate(chunk):
        title = job.get("title", "Unknown Role")
        company = job.get("company", "")
        desc = (job.get("description") or "")[:600]
        job_lines.append(f"[{i}] {title} at {company}\nDESCRIPTION: {desc}")

    user_message = (
        f"CANDIDATE PROFILE:\n{profile_text}\n\n"
        f"JOBS TO ANALYZE:\n" + "\n\n".join(job_lines)
    )

    try:
        response = await _client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": _BATCH_SYSTEM},
                {"role": "user", "content": user_message},
            ],
            temperature=0.2,
        )
        raw = _strip_fences(response.choices[0].message.content or "")
        parsed = json.loads(raw)

        # Build an index by job_index, fall back to positional order
        by_index: dict[int, dict] = {}
        for item in parsed:
            if isinstance(item, dict):
                idx = item.get("job_index")
                if idx is not None:
                    by_index[int(idx)] = item

        results = []
        for i in range(len(chunk)):
            entry = by_index.get(i) or (parsed[i] if i < len(parsed) else None)
            if entry and isinstance(entry, dict):
                score = max(0, min(100, int(entry.get("compatibility_score", 0))))
                entry["compatibility_score"] = score
                results.append(entry)
            else:
                results.append(_default_result())
        return results

    except Exception:
        log.exception("_analyze_chunk failed for chunk of %d jobs", len(chunk))
        return [_default_result() for _ in chunk]


async def analyze_jobs_batch(profile: dict, jobs: list[dict], batch_size: int = 8) -> list[dict]:
    """Analyze all jobs in parallel batches. Returns list[dict] in the same order as jobs."""
    if not jobs:
        return []

    profile_text = _format_profile(profile)
    chunks = [jobs[i:i + batch_size] for i in range(0, len(jobs), batch_size)]

    import asyncio
    chunk_results = await asyncio.gather(
        *[_analyze_chunk(profile_text, chunk) for chunk in chunks],
        return_exceptions=True,
    )

    results = []
    for chunk, chunk_result in zip(chunks, chunk_results):
        if isinstance(chunk_result, Exception):
            log.exception("analyze_jobs_batch: chunk failed")
            results.extend([_default_result() for _ in chunk])
        else:
            results.extend(chunk_result)
    return results
