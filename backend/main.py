"""FastAPI server. POST /run streams agent events as NDJSON."""
import json
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent import run_agent
from profile import router as profile_router

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
