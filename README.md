# agent.runner

AI-powered job compatibility analyzer built at the **NemoClaw NVIDIA x ASUS Hackathon @ UC Santa Cruz** (May 2026).

Fill out your profile once. A background agent continuously fetches live job listings from Adzuna, scores each one against your experience using **NVIDIA Nemotron**, and surfaces your top matches ranked by fit — no manual searching required.

```
agent-app/
├── backend/
│   ├── agent/
│   │   ├── analyzer.py   ← Nemotron batch compatibility scoring
│   │   ├── loop.py       ← background polling loop
│   │   └── tools.py
│   ├── main.py           ← FastAPI app, NDJSON streaming
│   ├── jobs.py           ← Adzuna fetching + Supabase storage
│   ├── profile.py        ← user profile API
│   └── auth.py
└── frontend/
    └── src/
        ├── pages/        ← Profile, Home (top matches), Jobs
        ├── components/
        └── App.jsx
```

## How it works

1. **Profile** — enter your skills, experience, projects, and job preferences.
2. **Fetch** — every 30 minutes (or on demand) the backend pulls fresh listings from Adzuna based on your preferred roles and locations.
3. **Analyze** — new listings are scored in batches of 8 using a single Nemotron LLM call per batch, producing a compatibility score (0–100), reasoning, and a ranked breakdown of your experiences by relevance to each job.
4. **Match** — the Home feed shows your top matches sorted by score.

## Quick start

You'll need two terminals and accounts for Supabase, Adzuna, and NVIDIA NIM.

### 1. Backend (Python 3.10+)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # fill in keys (see below)
uvicorn main:app --reload --port 8000
```

Required env vars in `.env`:

```
SUPABASE_URL=
SUPABASE_KEY=
NVIDIA_API_KEY=
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NEMOTRON_MODEL=nvidia/nvidia-nemotron-nano-9b-v2
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/jobs`, `/profile`, and `/run` to the FastAPI server on `:8000`.

## Stack

- **FastAPI** — async-native, painless NDJSON streaming
- **NVIDIA Nemotron** via NIM — batch LLM calls for job compatibility scoring
- **Adzuna API** — live job listings
- **Supabase** — auth + database
- **React + Vite** — fast dev loop

## Hackathon

Built in 24 hours at the [NemoClaw NVIDIA x ASUS Hackathon @ UC Santa Cruz](https://luma.com/hack-a-clawxucsc) — the premier physical AI hackathon on the West Coast, hosted at Kresge College, May 15–16 2026. Sponsored by NVIDIA, ASUS, and the Baskin School of Engineering.
