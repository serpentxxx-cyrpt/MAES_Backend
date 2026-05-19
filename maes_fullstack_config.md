# MAES — Full-Stack Infrastructure Configuration (Free Tier Only)
# Multi-Agent Educational Scaffolding System
# Frontend · Backend · Database · Deployment
# Every tool listed here has a permanently free tier — no credit card required for dev/research use

---

## FREE TIER STACK DECISION TABLE

| Layer              | Tool                  | Free Limits                              | Why chosen                          |
|--------------------|-----------------------|------------------------------------------|-------------------------------------|
| Frontend host      | Vercel                | Unlimited personal projects, 100 GB/mo   | Zero-config React + Vite deploy     |
| Auth               | Supabase Auth         | 50,000 MAU free forever                  | Built-in JWT, email/OAuth providers |
| Backend host       | Render                | 750 hrs/mo free web service              | FastAPI Docker deploy, free TLS     |
| Primary DB         | Supabase PostgreSQL   | 500 MB, unlimited rows                   | Same project as auth, no extra setup|
| Audit DB           | Neon (serverless PG)  | 512 MB, 1 branch free                    | Separate audit store, branching     |
| Cache / sessions   | Upstash Redis         | 10,000 commands/day free                 | HTTP-based Redis, no server needed  |
| Background jobs    | Render Cron Jobs      | Free with Render account                 | Replaces Celery for write-backs     |
| LLM — Agent A      | Groq API              | Free tier: llama-3.1-8b-instant          | Fastest free inference available    |
| LLM — Agent B      | Google Gemini API     | Free tier: gemini-1.5-flash              | Strongest free model for auditing   |
| LLM fallback       | OpenRouter            | Free models: Mistral 7B, Phi-3           | Model routing with free quota       |
| Orchestration      | LangGraph (local lib) | Open source, no API cost                 | Pure Python, runs in your backend   |
| Teacher dashboard  | Grafana Cloud         | Free forever, 10,000 metrics/mo          | Connects to Supabase via plugin     |
| CI / CD            | GitHub Actions        | 2,000 mins/mo free                       | Auto-deploy on push                 |
| Container registry | GitHub Container Reg. | Free for public repos                    | Stores Docker images                |
| Domain / TLS       | Render free subdomain | yourapp.onrender.com — free TLS included | No domain purchase needed           |

---

## 1. PROJECT STRUCTURE

```
maes/
├── frontend/                     # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── StudentChat.tsx
│   │   │   ├── TeacherDashboard.tsx
│   │   │   └── AdminPanel.tsx
│   │   ├── components/
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── AuditLogTable.tsx
│   │   │   ├── BloomBadge.tsx
│   │   │   └── SessionCard.tsx
│   │   ├── hooks/
│   │   │   ├── useSession.ts
│   │   │   └── useAuditLog.ts
│   │   └── lib/
│   │       ├── supabaseClient.ts
│   │       └── apiClient.ts
│   ├── .env.local
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                      # FastAPI + Python
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── session.py        # POST /session/start  /session/end
│   │   │   ├── turn.py           # POST /turn
│   │   │   ├── audit.py          # GET  /audit/{session_id}
│   │   │   └── simulate.py       # POST /simulate
│   │   ├── agents/
│   │   │   ├── agent_a.py        # Socratic Tutor — Groq llama-3.1-8b
│   │   │   ├── agent_b.py        # Auditor — Gemini 1.5 Flash
│   │   │   └── orchestrator.py   # LangGraph graph
│   │   ├── db/
│   │   │   ├── supabase_client.py
│   │   │   ├── neon_client.py
│   │   │   ├── upstash_client.py
│   │   │   └── models.py
│   │   └── config.py
│   ├── .env
│   ├── requirements.txt
│   └── Dockerfile
│
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml   # Vercel auto-deploy
│       └── deploy-backend.yml    # Render auto-deploy
│
└── docker-compose.yml            # local dev only
```

---

## 2. ENVIRONMENT VARIABLES

### frontend/.env.local

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-app.onrender.com
```

### backend/.env

```env
# ── App ────────────────────────────────────────────────────────────────────────
APP_ENV=development
SECRET_KEY=generate-with-openssl-rand-hex-32

# ── Supabase (primary DB + Auth) ───────────────────────────────────────────────
# Get from: supabase.com → project → Settings → API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres.your-project-id:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# ── Neon (audit DB) ────────────────────────────────────────────────────────────
# Get from: neon.tech → project → Connection string
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# ── Upstash Redis (session cache) ──────────────────────────────────────────────
# Get from: upstash.com → database → REST API
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# ── LLM APIs (all free tier) ───────────────────────────────────────────────────
# Groq: console.groq.com → API Keys
GROQ_API_KEY=gsk_...

# Gemini: aistudio.google.com → Get API key
GEMINI_API_KEY=AIza...

# OpenRouter fallback: openrouter.ai → Keys
OPENROUTER_API_KEY=sk-or-...

# ── Agent model assignment ─────────────────────────────────────────────────────
AGENT_A_MODEL=llama-3.1-8b-instant          # Groq — fast, free
AGENT_B_MODEL=gemini-1.5-flash              # Gemini — stronger reasoning, free
FALLBACK_MODEL=mistralai/mistral-7b-instruct # OpenRouter — free tier

# ── Session ────────────────────────────────────────────────────────────────────
SESSION_TTL_MINUTES=30
```

---

## 3. FRONTEND SETUP

### Install dependencies

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install @supabase/supabase-js axios react-router-dom zustand
npm install recharts lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### src/lib/supabaseClient.ts

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### src/lib/apiClient.ts

```typescript
import axios from 'axios'
import { supabase } from './supabaseClient'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token)
    config.headers.Authorization = `Bearer ${session.access_token}`
  return config
})

export default api
```

### src/hooks/useSession.ts

```typescript
import { useState } from 'react'
import api from '../lib/apiClient'

export function useSession(studentId: string, domain: string) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<{role: string; text: string}[]>([])
  const [loading, setLoading] = useState(false)

  const startSession = async () => {
    const { data } = await api.post('/session/start', { student_id: studentId, domain })
    setSessionId(data.session_id)
  }

  const sendMessage = async (text: string) => {
    if (!sessionId) return
    setLoading(true)
    setMessages(m => [...m, { role: 'student', text }])
    const { data } = await api.post('/turn', { session_id: sessionId, student_message: text })
    setMessages(m => [...m, { role: 'tutor', text: data.hint_text }])
    setLoading(false)
  }

  const endSession = async () => {
    if (!sessionId) return
    await api.post('/session/end', { session_id: sessionId })
    setSessionId(null)
  }

  return { startSession, sendMessage, endSession, messages, loading }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/api/, '')
      }
    }
  }
})
```

---

## 4. BACKEND SETUP

### requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.1
pydantic-settings==2.2.1
sqlalchemy==2.0.30
asyncpg==0.29.0
alembic==1.13.1
httpx==0.27.0
groq==0.9.0
google-generativeai==0.7.0
openai==1.30.1              # used for OpenRouter (OpenAI-compatible endpoint)
langgraph==0.1.4
upstash-redis==1.1.0
supabase==2.4.2
python-dotenv==1.0.1
python-jose[cryptography]==3.3.0
```

### app/config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_env: str = "development"
    secret_key: str
    supabase_url: str
    supabase_service_role_key: str
    supabase_db_url: str
    neon_database_url: str
    upstash_redis_rest_url: str
    upstash_redis_rest_token: str
    groq_api_key: str
    gemini_api_key: str
    openrouter_api_key: str
    agent_a_model: str = "llama-3.1-8b-instant"
    agent_b_model: str = "gemini-1.5-flash"
    fallback_model: str = "mistralai/mistral-7b-instruct"
    session_ttl_minutes: int = 30

    class Config:
        env_file = ".env"

settings = Settings()
```

### app/db/upstash_client.py — session cache

```python
from upstash_redis import Redis
from app.config import settings
import json

redis = Redis(
    url=settings.upstash_redis_rest_url,
    token=settings.upstash_redis_rest_token
)

async def get_session_context(session_id: str) -> dict | None:
    raw = redis.get(f"session:{session_id}")
    return json.loads(raw) if raw else None

async def set_session_context(session_id: str, context: dict) -> None:
    redis.set(
        f"session:{session_id}",
        json.dumps(context),
        ex=settings.session_ttl_minutes * 60
    )

async def delete_session(session_id: str) -> None:
    redis.delete(f"session:{session_id}")
```

### app/agents/agent_a.py — Groq (llama-3.1-8b)

```python
from groq import Groq
from app.config import settings
import json

client = Groq(api_key=settings.groq_api_key)

AGENT_A_SYSTEM = """
You are Agent A: the Socratic Tutor. Never reveal answers directly.
Always respond with a JSON object only:
{
  "hint_text": "...",
  "internal_reasoning": "...",
  "estimated_bloom_level": "remember|understand|apply|analyze|evaluate|create"
}
"""

async def run_agent_a(state: dict) -> dict:
    correction = state.get("agent_b_signal", {})
    correction_note = ""
    if correction.get("correction"):
        correction_note = f"\n\nAUDIT CORRECTION: {correction['correction']}"
    if correction.get("register_switch"):
        correction_note += f"\nSWITCH REGISTER TO: {correction['register_switch']}"

    messages = [
        {"role": "system", "content": AGENT_A_SYSTEM + correction_note},
        {"role": "user",   "content": json.dumps({
            "student_message": state["student_message"],
            "current_register": state.get("current_register", "socratic"),
            "learner_model": state["learner_model"]
        })}
    ]

    response = client.chat.completions.create(
        model=settings.agent_a_model,
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.4,
        max_tokens=400
    )

    draft = json.loads(response.choices[0].message.content)
    return {**state, "agent_a_draft": draft}
```

### app/agents/agent_b.py — Gemini 1.5 Flash

```python
import google.generativeai as genai
from app.config import settings
import json

genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel("gemini-1.5-flash")

AGENT_B_SYSTEM = """
You are Agent B: the Pedagogical Auditor. Evaluate the tutor's draft hint.
Return ONLY a valid JSON object with this exact structure:
{
  "decision": "APPROVE|REQUEST_REVISION|SWITCH_REGISTER",
  "correction_note": "...",
  "register_switch": null,
  "struggle_level": "productive|stalled|null",
  "bloom_tag_student": "remember|understand|apply|analyze|evaluate|create",
  "bloom_tag_hint": "remember|understand|apply|analyze|evaluate|create",
  "rubric_scores": {
    "hint_quality": 1-5,
    "tone": 1-5,
    "correctness": 1-5,
    "bloom_alignment": 1-5
  }
}
Approve if avg score >= 3.5 AND correctness >= 4. Otherwise REQUEST_REVISION.
"""

async def run_agent_b(state: dict) -> dict:
    payload = {
        "student_message": state["student_message"],
        "agent_a_draft": state["agent_a_draft"],
        "learner_model": state["learner_model"],
        "current_register": state.get("current_register", "socratic"),
        "turn_number": state.get("turn_number", 1)
    }

    response = model.generate_content(
        AGENT_B_SYSTEM + "\n\nEVALUATE THIS:\n" + json.dumps(payload),
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.1,
            max_output_tokens=600
        )
    )

    result = json.loads(response.text)
    return {**state, "agent_b_result": result}
```

### app/agents/orchestrator.py — LangGraph

```python
from langgraph.graph import StateGraph, END
from app.agents.agent_a import run_agent_a
from app.agents.agent_b import run_agent_b
from typing import TypedDict, Optional

class TurnState(TypedDict):
    session_id: str
    student_message: str
    learner_model: dict
    current_register: str
    turn_number: int
    agent_a_draft: Optional[dict]
    agent_b_result: Optional[dict]
    agent_b_signal: Optional[dict]

def route_after_audit(state: TurnState) -> str:
    decision = state.get("agent_b_result", {}).get("decision", "APPROVE")
    return END if decision == "APPROVE" else "revise"

def inject_correction(state: TurnState) -> TurnState:
    b = state["agent_b_result"]
    return {**state, "agent_b_signal": {
        "correction": b.get("correction_note"),
        "register_switch": b.get("register_switch"),
        "struggle_level": b.get("struggle_level")
    }}

def build_graph():
    g = StateGraph(TurnState)
    g.add_node("agent_a",         run_agent_a)
    g.add_node("agent_b",         run_agent_b)
    g.add_node("inject_signal",   inject_correction)
    g.add_node("revise",          run_agent_a)

    g.set_entry_point("agent_a")
    g.add_edge("agent_a", "agent_b")
    g.add_edge("agent_b", "inject_signal")
    g.add_conditional_edges("inject_signal", route_after_audit, {END: END, "revise": "revise"})
    g.add_edge("revise", END)
    return g.compile()

graph = build_graph()

async def run_turn(session_id: str, student_message: str, context: dict) -> dict:
    initial: TurnState = {
        "session_id": session_id,
        "student_message": student_message,
        "learner_model": context.get("learner_model", {}),
        "current_register": context.get("current_register", "socratic"),
        "turn_number": context.get("turn_number", 1),
        "agent_a_draft": None,
        "agent_b_result": None,
        "agent_b_signal": None,
    }
    final = await graph.ainvoke(initial)
    hint = (final.get("agent_a_draft") or {}).get("hint_text", "")
    bloom = (final.get("agent_b_result") or {}).get("bloom_tag_student", "")
    return {
        "hint_text": hint,
        "bloom_tag": bloom,
        "updated_context": {
            **context,
            "turn_number": context.get("turn_number", 1) + 1,
            "current_register": (final.get("agent_b_result") or {}).get("register_switch")
                                 or context.get("current_register", "socratic")
        }
    }
```

### app/main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import session, turn, audit, simulate

app = FastAPI(title="MAES API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router,  prefix="/session",  tags=["session"])
app.include_router(turn.router,     prefix="/turn",     tags=["turn"])
app.include_router(audit.router,    prefix="/audit",    tags=["audit"])
app.include_router(simulate.router, prefix="/simulate", tags=["simulate"])
```

---

## 5. DATABASE SCHEMA

### Supabase SQL — run in Supabase SQL editor

```sql
-- Users (managed by Supabase Auth; this extends it)
create table public.student_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz default now()
);

-- Sessions
create table public.sessions (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid references public.student_profiles(id),
  domain         text not null,
  session_number integer not null default 1,
  started_at     timestamptz default now(),
  ended_at       timestamptz,
  mode           text default 'live'  -- 'live' | 'simulation'
);

-- Learner model (one row per student, updated each session end)
create table public.learner_models (
  student_id          uuid primary key references public.student_profiles(id),
  mastered_concepts   jsonb default '[]',
  working_concepts    jsonb default '[]',
  recurring_errors    jsonb default '[]',
  preferred_style     text  default 'socratic',
  bloom_level_history jsonb default '[]',
  sessions_completed  integer default 0,
  updated_at          timestamptz default now()
);

-- Domain knowledge base
create table public.domain_concepts (
  id            text primary key,
  label         text not null,
  domain        text not null,
  prerequisites jsonb default '[]'
);

create table public.misconceptions (
  id          text primary key,
  description text not null,
  concept_id  text references public.domain_concepts(id),
  domain      text not null
);

-- Row-level security: students can only read their own data
alter table public.sessions      enable row level security;
alter table public.learner_models enable row level security;

create policy "student own sessions"
  on public.sessions for select
  using (auth.uid() = student_id);

create policy "student own learner model"
  on public.learner_models for select
  using (auth.uid() = student_id);
```

### Neon SQL — run in Neon console (audit database)

```sql
-- Audit log (append-only, never updated)
create table audit_log (
  id                   bigserial primary key,
  session_id           uuid not null,
  student_id           uuid not null,
  turn_number          integer not null,
  recorded_at          timestamptz default now(),
  student_message      text,
  hint_delivered       text,
  bloom_tag_student    text,
  bloom_tag_hint       text,
  register_at_turn     text,
  decision             text,           -- APPROVE | REQUEST_REVISION | SWITCH_REGISTER
  correction_applied   boolean default false,
  struggle_level       text,
  score_hint_quality   smallint,
  score_tone           smallint,
  score_correctness    smallint,
  score_bloom_align    smallint,
  is_simulation        boolean default false
);

create index on audit_log (session_id);
create index on audit_log (student_id);
create index on audit_log (recorded_at desc);
```

---

## 6. DOCKER COMPOSE — LOCAL DEV

```yaml
version: "3.9"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
    ports:
      - "3000:3000"
    command: sh -c "npm install && npm run dev -- --host"
    env_file:
      - ./frontend/.env.local

# No local Postgres or Redis needed —
# dev points to Supabase + Neon + Upstash cloud free tiers
```

### backend/Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 7. CI/CD — GITHUB ACTIONS

### .github/workflows/deploy-backend.yml

```yaml
name: Deploy backend to Render
on:
  push:
    branches: [main]
    paths: [backend/**]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Trigger Render deploy hook
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

### .github/workflows/deploy-frontend.yml

```yaml
name: Deploy frontend to Vercel
on:
  push:
    branches: [main]
    paths: [frontend/**]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token:   ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id:  ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

---

## 8. STEP-BY-STEP ACCOUNT SETUP (in order)

```
1. GitHub           → Create repo "maes" (free)
                      → Settings → Secrets: add all CI secrets

2. Supabase         → supabase.com → New project (free)
                      → Run schema SQL from Section 5
                      → Copy: URL, anon key, service role key, DB URL

3. Neon             → neon.tech → New project (free)
                      → Run audit schema SQL from Section 5
                      → Copy: connection string

4. Upstash          → upstash.com → Create Redis DB (free)
                      → Copy: REST URL + token

5. Groq             → console.groq.com → Create API key (free)
                      → Model: llama-3.1-8b-instant

6. Google AI Studio → aistudio.google.com → Get API key (free)
                      → Model: gemini-1.5-flash

7. OpenRouter       → openrouter.ai → Create key (free credits on signup)
                      → Fallback model: mistralai/mistral-7b-instruct

8. Render           → render.com → New Web Service
                      → Connect GitHub repo, set root to /backend
                      → Add all backend env vars from Section 2
                      → Copy: deploy hook URL → add to GitHub secrets

9. Vercel           → vercel.com → Import GitHub repo
                      → Set root to /frontend
                      → Add VITE_ env vars
                      → Copy: token + org + project IDs → GitHub secrets

10. Grafana Cloud   → grafana.com → Free account
                      → Install Supabase plugin
                      → Connect to your Supabase DB for teacher dashboards
```

---

## 9. FREE TIER LIMITS TO WATCH

| Service          | Limit to monitor                          | What happens if exceeded         |
|------------------|-------------------------------------------|----------------------------------|
| Render           | Spins down after 15 min inactivity        | Cold start ~30 sec on next req   |
| Upstash Redis    | 10,000 commands/day                       | Commands fail — add caching logic|
| Supabase DB      | 500 MB storage                            | Writes blocked — archive old sessions |
| Neon             | 512 MB, compute pauses after 5 min idle   | Auto-resumes on next query       |
| Groq             | Rate limit ~30 req/min on free tier       | 429 error — add retry with backoff|
| Gemini           | 15 req/min, 1M tokens/day free            | 429 error — fallback to OpenRouter|
| Vercel           | 100 GB bandwidth/mo                       | Site pauses until month resets   |
| GitHub Actions   | 2,000 min/mo                              | Deploys queue until next month   |

### Groq retry pattern (add to agent_a.py)

```python
import time

def call_groq_with_retry(client, messages, model, retries=3):
    for attempt in range(retries):
        try:
            return client.chat.completions.create(
                model=model, messages=messages,
                response_format={"type": "json_object"},
                temperature=0.4, max_tokens=400
            )
        except Exception as e:
            if "429" in str(e) and attempt < retries - 1:
                time.sleep(2 ** attempt)  # 1s, 2s, 4s
            else:
                raise
```

