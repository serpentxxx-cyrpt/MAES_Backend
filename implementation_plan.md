# MAES — Updated Implementation Plan v2

## Decisions Locked In

| Question | Decision |
|----------|----------|
| CSS Framework | **TailwindCSS** — keep it, UI polish later |
| Domain Scope | **Universal** — any subject, any level, no hardcoded domain |
| JSON Handling | **Add JSON repair/validation layer** with retry |
| Dashboard | **Both** — React in-app for users + Grafana Cloud for admins |
| Accounts | **All 10 from scratch** |
| Frontend Style | **NotebookLM-style 3-panel UI** with sources, chat, studio |

---

## All 9 Issues — Resolved

### 🔴 Critical Fixes (6)

#### 1. Orchestration Flow Clarified
**Resolution:** Implement the config file's flow: `Agent A → Agent B → conditional revise`. The system prompt doc's "call sequence" section will be treated as describing steady-state context passing only. No code conflict.

#### 2. Missing Route Implementations
**Resolution:** Write all 4 route handlers from scratch:
- `session.py` — start/end with Redis + Supabase integration
- `turn.py` — orchestrator invocation + audit logging
- `audit.py` — Neon query with pagination
- `simulate.py` — F8 loop with Agent S + report generation

#### 3. `google-generativeai` Version Fix
**Resolution:** Use latest stable version. Updated in requirements:
```diff
- google-generativeai==0.7.0
+ google-generativeai>=0.8.0
```

#### 4. LangGraph Version Fix
**Resolution:** Target LangGraph v1.0+ (stable). Key changes:
```diff
- langgraph==0.1.4
+ langgraph>=1.0.0
```
- Keep `TypedDict` state (still supported)
- Keep `StateGraph` + `.compile()` pattern (still valid)
- Requires **Python 3.10+** (update Dockerfile base image)
- `add_conditional_edges` API is stable in v1.0

#### 5. Async/Sync Mismatch Fix
**Resolution:** Use the async Upstash client:
```python
from upstash_redis.asyncio import Redis  # instead of upstash_redis.Redis
```
All `async def` functions will now correctly `await` Redis calls.

#### 6. Learner Model Write-Back
**Resolution:** Accumulate `learner_model_updates` from Agent B in Redis during the session. On `POST /session/end`, merge all accumulated updates into Supabase `learner_models` table via upsert.

---

### 🟡 Quality Fixes (3 additional from the 9)

#### 7. JSON Repair/Validation Layer
**Resolution:** Add a `json_utils.py` module:
- Try `json.loads()` first
- On failure, use regex cleanup (strip markdown fences, trailing commas)
- On second failure, use `json-repair` library
- On third failure, retry LLM call with stricter prompt
- Validate output against Pydantic schemas

#### 8. Fallback Chain Implementation
**Resolution:** Add fallback logic to both agents:
- Agent A: Groq → OpenRouter (Mistral 7B) on 429/500
- Agent B: Gemini → OpenRouter (Mistral 7B) on 429/500
- Exponential backoff retry (1s, 2s, 4s) before fallback

#### 9. Missing DB Clients + Pydantic Models
**Resolution:** Implement:
- `supabase_client.py` — full CRUD for sessions, learner_models, domain_concepts, misconceptions
- `neon_client.py` — append + query for audit_log (using `asyncpg`)
- `models.py` — Pydantic schemas for all request/response types
- Teacher role via Supabase custom claims (not just student RLS)

---

## 🎨 Frontend — NotebookLM-Style 3-Panel UI

### Layout Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Navbar: Logo | Notebook Selector | User Menu | Settings    │
├──────────┬────────────────────────┬─────────────────────────┤
│          │                        │                         │
│ SOURCES  │     CHAT PANEL         │   STUDIO PANEL          │
│ PANEL    │                        │                         │
│ (Left)   │  Socratic tutoring     │  Notes / Flashcards /   │
│          │  conversation with     │  Study Guides /         │
│ Upload   │  Agent A               │  Bloom Progress /       │
│ sources: │                        │  Quiz Generation        │
│ - Files  │  Inline citations      │                         │
│ - URLs   │  linking to sources    │  Session History        │
│ - Drive  │                        │  Audit Summary (lite)   │
│ - YouTube│  Bloom level badges    │                         │
│ - Paste  │  on each response      │                         │
│          │                        │                         │
│ Toggle   │  Typing indicator      │  Export options          │
│ sources  │  with "thinking" state │                         │
│ on/off   │                        │                         │
├──────────┴────────────────────────┴─────────────────────────┤
│  Status Bar: Current Register | Bloom Level | Session Timer │
└─────────────────────────────────────────────────────────────┘
```

### Panel Details

#### Left Panel — Sources Management
- **Upload sources**: PDF, DOCX, TXT, MD, CSV, images (drag & drop + file picker)
- **Import from URL**: Paste website URL → backend scrapes text content
- **Import from YouTube**: Paste YouTube URL → extract transcript via API
- **Google Drive**: OAuth connect → pick files from Drive
- **Manual paste**: Create a source from raw text input
- **Source toggle**: Select/deselect sources to focus the tutor's knowledge scope
- **Source preview**: Click a source to see its extracted content
- **Max 50 sources per notebook** (matching NotebookLM)

> [!IMPORTANT]
> Source import requires additional backend processing:
> - **URL scraping**: Use `httpx` + `beautifulsoup4` to extract text
> - **YouTube transcripts**: Use `youtube-transcript-api` (free, no API key needed)
> - **PDF parsing**: Use `pymupdf` or `pdfplumber`
> - **Google Drive**: Requires Google OAuth + Drive API (free but needs credentials)
> These are **2 additional API keys** on top of the original 10.

#### Center Panel — Socratic Chat
- Chat bubbles with role differentiation (student vs tutor)
- **Bloom level badge** on each tutor response (color-coded)
- **Inline citations** linking to source passages when the tutor references material
- **Register indicator** showing current tutoring style (Socratic / Analogy / Worked Example / Error Correction)
- Typing indicator with animated dots during LLM processing
- Message input with send button + keyboard shortcut (Enter)
- Session start/end controls

#### Right Panel — Studio
- **Notes**: Create/save/edit notes from chat responses or manually
- **Flashcards**: Auto-generate flashcard decks from sources + session history
  - Flip animation, Got it / Missed it tracking
  - Spaced repetition suggestions
- **Quizzes**: Generate MCQ quizzes grounded in sources
  - Difficulty calibrated to current Bloom level
- **Study Guides**: Generate structured outlines from sources
- **Bloom Progression Chart**: Recharts visualization of learning trajectory
- **Session History**: List of past sessions with summary cards
- **Export**: Download notes/flashcards as PDF or JSON

### New Pages (Updated)

| Page | Purpose | Access |
|------|---------|--------|
| `NotebookView.tsx` | Main 3-panel workspace (replaces old `StudentChat.tsx`) | Students |
| `TeacherDashboard.tsx` | In-app analytics: rubric scores, Bloom progression, class overview | Teachers |
| `AdminPanel.tsx` | Domain management, simulation runner, system config | Admins |
| `LoginPage.tsx` | Supabase Auth (email + OAuth) | All |
| `NotebookList.tsx` | Grid of user's notebooks (like NotebookLM home) | All |

---

## 🔑 Updated API Keys — Complete Final List

### Original 10 services (15 keys)
*(Same as Plan v1 — Groq, Gemini, OpenRouter, Supabase, Neon, Upstash, Render, Vercel, GitHub, Grafana)*

### NEW: Additional Keys for NotebookLM Features

| # | Service | Key(s) | Purpose | Free Tier |
|---|---------|--------|---------|-----------|
| 11 | **Google Cloud OAuth** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Drive file import | Free (Cloud Console) |
| 12 | **YouTube Transcript** | *None needed* | `youtube-transcript-api` lib, no key | Fully free |

> **Grand Total: 11 accounts, ~17 keys/tokens**

---

## Updated Project Structure

```
maes/
├── frontend/                        # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── pages/
│   │   │   ├── NotebookView.tsx     # Main 3-panel workspace
│   │   │   ├── NotebookList.tsx     # Notebook grid (home)
│   │   │   ├── TeacherDashboard.tsx # In-app analytics
│   │   │   ├── AdminPanel.tsx       # Admin controls
│   │   │   └── LoginPage.tsx        # Auth page
│   │   ├── components/
│   │   │   ├── panels/
│   │   │   │   ├── SourcesPanel.tsx
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   └── StudioPanel.tsx
│   │   │   ├── sources/
│   │   │   │   ├── SourceUploader.tsx
│   │   │   │   ├── SourceCard.tsx
│   │   │   │   ├── UrlImporter.tsx
│   │   │   │   └── DriveImporter.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatBubble.tsx
│   │   │   │   ├── BloomBadge.tsx
│   │   │   │   ├── RegisterBadge.tsx
│   │   │   │   └── TypingIndicator.tsx
│   │   │   ├── studio/
│   │   │   │   ├── NotesEditor.tsx
│   │   │   │   ├── FlashcardDeck.tsx
│   │   │   │   ├── QuizGenerator.tsx
│   │   │   │   ├── StudyGuide.tsx
│   │   │   │   └── BloomChart.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── RubricScoreChart.tsx
│   │   │   │   ├── SessionTimeline.tsx
│   │   │   │   └── ClassOverview.tsx
│   │   │   └── shared/
│   │   │       ├── Navbar.tsx
│   │   │       ├── StatusBar.tsx
│   │   │       └── Modal.tsx
│   │   ├── hooks/
│   │   │   ├── useSession.ts
│   │   │   ├── useAuditLog.ts
│   │   │   ├── useSources.ts
│   │   │   ├── useNotebook.ts
│   │   │   └── useFlashcards.ts
│   │   ├── stores/
│   │   │   ├── sessionStore.ts      # Zustand
│   │   │   ├── sourceStore.ts
│   │   │   └── notebookStore.ts
│   │   └── lib/
│   │       ├── supabaseClient.ts
│   │       └── apiClient.ts
│   ├── .env.local
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                          # FastAPI + Python 3.10+
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── routes/
│   │   │   ├── session.py
│   │   │   ├── turn.py
│   │   │   ├── audit.py
│   │   │   ├── simulate.py
│   │   │   ├── sources.py           # NEW: source upload/import
│   │   │   ├── notebooks.py         # NEW: notebook CRUD
│   │   │   └── studio.py            # NEW: flashcards/quiz/notes gen
│   │   ├── agents/
│   │   │   ├── agent_a.py
│   │   │   ├── agent_b.py
│   │   │   ├── agent_s.py           # NEW: simulated student
│   │   │   └── orchestrator.py
│   │   ├── services/
│   │   │   ├── source_processor.py  # NEW: PDF/URL/YouTube parsing
│   │   │   ├── flashcard_gen.py     # NEW: flashcard generation
│   │   │   ├── quiz_gen.py          # NEW: quiz generation
│   │   │   └── json_utils.py        # NEW: JSON repair/validation
│   │   ├── db/
│   │   │   ├── supabase_client.py
│   │   │   ├── neon_client.py
│   │   │   ├── upstash_client.py
│   │   │   └── models.py
│   │   └── middleware/
│   │       └── auth.py              # NEW: JWT validation + role check
│   ├── .env
│   ├── requirements.txt
│   └── Dockerfile                   # Python 3.10+ base
│
├── .github/workflows/
│   ├── deploy-frontend.yml
│   └── deploy-backend.yml
│
└── docker-compose.yml
```

---

## Updated Database Schema

### NEW Supabase Tables (added to existing schema)

```sql
-- Notebooks (like NotebookLM notebooks)
create table public.notebooks (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references public.student_profiles(id),
  title       text not null default 'Untitled Notebook',
  domain      text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Sources per notebook
create table public.sources (
  id           uuid primary key default gen_random_uuid(),
  notebook_id  uuid references public.notebooks(id) on delete cascade,
  source_type  text not null,  -- 'pdf' | 'url' | 'youtube' | 'drive' | 'paste' | 'note'
  title        text,
  raw_content  text,           -- extracted text
  metadata     jsonb default '{}',
  is_active    boolean default true,  -- toggle on/off
  created_at   timestamptz default now()
);

-- Notes (studio panel)
create table public.notes (
  id           uuid primary key default gen_random_uuid(),
  notebook_id  uuid references public.notebooks(id) on delete cascade,
  title        text,
  content      text,
  source_refs  jsonb default '[]',  -- citation links
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Flashcard decks
create table public.flashcard_decks (
  id           uuid primary key default gen_random_uuid(),
  notebook_id  uuid references public.notebooks(id) on delete cascade,
  title        text,
  created_at   timestamptz default now()
);

create table public.flashcards (
  id         uuid primary key default gen_random_uuid(),
  deck_id    uuid references public.flashcard_decks(id) on delete cascade,
  front      text not null,
  back       text not null,
  status     text default 'unseen',  -- 'unseen' | 'got_it' | 'missed'
  sort_order integer default 0
);
```

---

## Updated Requirements.txt

```
# Core
fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic==2.9.0
pydantic-settings==2.5.0

# Database
sqlalchemy==2.0.35
asyncpg==0.30.0
alembic==1.13.3
supabase==2.9.0

# Cache
upstash-redis==1.1.0

# LLM
groq==0.11.0
google-generativeai>=0.8.0
openai==1.50.0
langgraph>=1.0.0

# Orchestration utils
httpx==0.27.2
python-dotenv==1.0.1
python-jose[cryptography]==3.3.0

# Source processing (NEW)
pymupdf==1.24.0
beautifulsoup4==4.12.3
youtube-transcript-api==0.6.2
python-docx==1.1.0

# JSON repair (NEW)
json-repair==0.30.0

# Utilities
tenacity==9.0.0  # retry logic
```

---

## Phased Execution (Updated — 9 Phases)

### Phase 1: Accounts & Keys (~20 min)
Create all 11 accounts in order, collect 17 keys.

### Phase 2: Project Scaffolding (~30 min)
Init frontend (Vite + React + Tailwind) and backend (FastAPI) structures.

### Phase 3: Database (~20 min)
Run all SQL in Supabase + Neon consoles. Implement DB client modules.

### Phase 4: Agent Core (~45 min)
Agent A, Agent B, JSON utils, fallback chains, orchestrator (LangGraph v1.0).

### Phase 5: API Routes (~50 min)
Session, turn, audit, simulate, sources, notebooks, studio routes + auth middleware.

### Phase 6: Frontend — Core Layout (~1.5 hours)
3-panel NotebookLM layout, sources panel, chat panel, auth flow.

### Phase 7: Frontend — Studio Features (~1.5 hours)
Notes editor, flashcard deck, quiz generator, Bloom chart, study guide.

### Phase 8: Dashboards (~40 min)
Teacher dashboard (React + Recharts) + Grafana Cloud config for admins.

### Phase 9: Deploy & Test (~30 min)
Docker local test → Push → Render + Vercel deploy → E2E smoke test.

**Estimated Total: ~7-8 hours**

---

## Verification Plan

### Automated
```bash
cd backend && python -m pytest tests/ -v          # Unit tests
cd frontend && npm run build                       # Build check
cd frontend && npx eslint src/                     # Lint check
```

### Manual
- Full turn cycle: message → Agent A → Agent B → response
- Source upload: PDF, URL, YouTube → text extraction verified
- Flashcard generation from sources
- Session persistence across browser refresh
- Render cold start + Groq 429 fallback
- Teacher dashboard data display
- Grafana Cloud connection to Supabase

---

> [!NOTE]
> All 9 original issues are resolved in this plan. The NotebookLM-style UI adds ~3 hours of frontend work but creates a significantly more polished product. The universal domain support means the `domain_knowledge_base` is user-populated via the Sources panel rather than hardcoded.
