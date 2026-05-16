"""FastAPI server. POST /run streams agent events as NDJSON."""
import json
import logging
from contextlib import asynccontextmanager
from typing import Annotated

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent import run_agent
from auth import get_current_user
from jobs import router as jobs_router, poll_all_users
from profile import router as profile_router

load_dotenv()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("agent-runner")

_scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _scheduler.add_job(poll_all_users, "interval", minutes=30, id="job_poll", replace_existing=True)
    _scheduler.start()
    log.info("Job poller started — polling Adzuna every 30 minutes")
    yield
    _scheduler.shutdown(wait=False)


app = FastAPI(title="Agent Runner", lifespan=lifespan)

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
app.include_router(jobs_router)


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


