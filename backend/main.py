"""FastAPI server. POST /run streams agent events as NDJSON."""
import json
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent import run_agent
from profile import Profile, save_profile, get_profile

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("agent-runner")

app = FastAPI(title="Agent Runner")

# Vite dev server runs on :5173 by default
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TaskRequest(BaseModel):
    task: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/profile")
async def create_profile(profile: Profile):
    saved = save_profile(profile)
    return {"status": "ok", "data": saved}


@app.get("/profile/{email}")
async def read_profile(email: str):
    data = get_profile(email)
    if data is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return data


@app.post("/run")
async def run(req: TaskRequest):
    """Stream agent events as NDJSON (newline-delimited JSON)."""
    log.info("run task=%r", req.task)

    async def stream():
        try:
            async for event in run_agent(req.task):
                yield json.dumps(event) + "\n"
        except Exception as e:
            log.exception("agent error")
            yield json.dumps({"type": "error", "content": str(e)}) + "\n"

    return StreamingResponse(stream(), media_type="application/x-ndjson")
