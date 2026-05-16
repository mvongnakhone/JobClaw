# agent.runner

Minimal web app framework for the Shortest Hack autonomous agent track. FastAPI streams agent events; React renders them live. Designed so the NemoClaw + Nemotron integration drops into a **single file**: `backend/agent.py`.

```
agent-app/
├── backend/
│   ├── agent.py          ← INTEGRATION POINT (NemoClaw goes here)
│   ├── main.py           ← FastAPI app, /run streams NDJSON
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx       ← UI: task input + live event stream
    │   ├── App.css
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Quick start

You'll want two terminals.

### 1. Backend (Python 3.10+)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # fill in NVIDIA_API_KEY when integrating
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/run` and `/health` to the FastAPI server on `:8000`, so there are no CORS headaches in dev.

Type a task, hit `⌘/Ctrl + Enter` (or click *execute*), and watch the stub agent stream events back.

## How it works

`POST /run` accepts `{ "task": "..." }` and returns an NDJSON stream — one JSON event per line. The frontend reads the body with `ReadableStream`, splits on newlines, and renders each event as it arrives.

### Event shapes

```json
{"type": "status",      "content": "thinking"}             // updates header indicator
{"type": "thought",     "content": "..."}                   // agent reasoning step
{"type": "tool_call",   "tool": "web_search", "args": {…}}  // calling a tool
{"type": "tool_result", "tool": "web_search", "content": "…"}
{"type": "final",       "content": "..."}                   // final answer
{"type": "error",       "content": "..."}
```

Add new event types freely — `EventRow` in `App.jsx` is the only place that needs to know about them.

## Wiring up NemoClaw + Nemotron

Open `backend/agent.py`. Replace the body of `run_agent(task)` with your real implementation. As long as you yield events in the shapes above, the frontend keeps working without changes.

Typical shape:

```python
async def run_agent(task: str):
    yield {"type": "status", "content": "thinking"}
    async for event in nemoclaw_client.run(task):
        yield translate_to_frontend_shape(event)
    yield {"type": "status", "content": "done"}
```

For Nemotron via `build.nvidia.com` directly, the OpenAI Python SDK works against the NVIDIA endpoint — set `base_url=NVIDIA_BASE_URL` and `api_key=NVIDIA_API_KEY` from `.env`.

## Why this stack

- **FastAPI** — async-native, painless streaming, lets NemoClaw (Python) plug in directly
- **NDJSON over a single HTTP stream** — simpler than SSE/websockets, works behind any proxy, easy to debug with `curl`
- **React + Vite** — fast dev loop, Motion for smooth event appearance
- **Instrument Serif + JetBrains Mono** — editorial + technical pairing, distinct from default AI-app aesthetics

## Testing the backend without the frontend

```bash
curl -N -X POST http://localhost:8000/run \
  -H 'Content-Type: application/json' \
  -d '{"task":"hello agent"}'
```

You'll see one JSON event per line stream out in real time.
