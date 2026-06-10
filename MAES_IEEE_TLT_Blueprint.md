# MAES: IEEE TLT Publication Gap Analysis & Revised Production Blueprint
**Multi-Agent Educational System — Strengthened for IEEE Transactions on Learning Technologies**

---

## PART 0: PUBLICATION READINESS ANALYSIS

### What the Current Landscape Shows

Research published in or submitted to IEEE TLT in 2024–2025 has moved rapidly. The following directly competitive or overlapping works must be understood before submission:

| Paper | Overlap with Your MAES | Gap It Leaves |
|---|---|---|
| **EduPlanner** (Zhang et al., IEEE TLT 2025) | Multi-agent adversarial collaboration (Evaluator + Optimizer + Analyst), iterative optimization, customized instructional design | Focused on *lesson planning*, not live tutoring dialogue; no student-facing chat; no real-time cognitive load sensing |
| **SocraticLM** (Liu et al., NeurIPS 2024) | Socratic personalized teaching with LLMs | Single-agent; no auditor/hallucination gating; no peer agent; no telemetry |
| **IntelliCode** (arXiv 2025) | Multi-agent tutoring with centralized learner modeling | Domain-specific (coding); no chronometric load; no dynamic visual scaffolding |
| **DiaCDM** (Jia et al., arXiv 2025) | Cognitive diagnosis in teacher–student dialogues (IRE framework) | Offline diagnosis, not real-time; no adaptive agent behavior |
| **Bloom's Taxonomy Labeling** (NTU 2025) | Scalable Bloom tagging of Socratic chatbot dialogues | Retrospective analytics only; no real-time adaptive routing |
| **LLM Cognitive Diagnosis (SOLO)** (FDE 2025) | LLM-driven cognitive diagnosis | Diagnostic only, no tutoring response loop |

### Verdict: Is Your Current Design Publishable As-Is?

**Partially.** Your design is technically impressive but has three critical weaknesses that IEEE TLT reviewers will flag:

1. **Novelty is engineering, not science.** Combining RAG + LangGraph + Auditor Agent is a *systems contribution*, not a *learning science contribution*. TLT requires empirical validation or a significant theoretical framing. Without a user study or at minimum a simulated evaluation, it will be desk-rejected.

2. **Chronometric Cognitive Load lacks a validated instrument.** Using backspace frequency and dwell time as a cognitive load proxy is promising but currently lacks citation to a validated psychometric model in your PRD. Reviewers will ask: how does this map to Paas's cognitive load theory or NASA-TLX? This needs grounding.

3. **The "Epistemic Conflict" mechanism from Agent P is the strongest novelty** — but it is currently described as a feature, not as a studied intervention. The gap in existing literature is precisely that no published system has closed the loop: *detect misconception → generate targeted fallacy from that specific misconception → measure whether conflict resolution improves learning outcomes.* This is your publishable core.

### What Makes MAES Uniquely Publishable (Your Real Novelty)

After surveying the landscape, the three things no existing IEEE TLT paper combines are:

1. **Closed-loop Misconception-Targeted Epistemic Conflict**: A pipeline where a GCD database drives Agent P to generate *personalized* fallacies anchored to *the student's own recorded errors*, not random ones.
2. **Chronometric Cognitive State Inference feeding back into agent strictness thresholds** — a novel passive sensing + adaptive gating mechanism.
3. **Modality-Shifting via Bloom Stall Detection**: Automatically triggering a generative visual component when the text modality fails — no published ITS does this.

These three together, with a user study measuring learning gain (pre/post test), form a credible IEEE TLT contribution under the framing: *"Adaptive Orchestration in Multi-Agent Tutoring: Combining Passive Cognitive Load Sensing, Targeted Epistemic Conflict, and Dynamic Modality Shifting."*

---

## PART 1: REVISED PRODUCT REQUIREMENTS DOCUMENT (PRD v2.0)

### 1.1 Project Title
**MAES: Multi-Agent Educational System with Chronometric Adaptation and Targeted Epistemic Conflict**

### 1.2 Product Vision
To build a deterministic, multi-agent Socratic tutoring platform that integrates three mutually-reinforcing adaptive mechanisms — passive cognitive load inference, misconception-targeted epistemic conflict, and dynamic modality shifting — validated against measurable learning outcomes for higher-education students.

### 1.3 Research Questions (for IEEE TLT framing)
- **RQ1**: Does chronometric-driven threshold adaptation reduce student dropout rates in Socratic dialogue compared to a static-threshold baseline?
- **RQ2**: Does misconception-targeted epistemic conflict (Agent P) produce greater conceptual correction than generic Socratic questioning?
- **RQ3**: Does Bloom-stall-triggered visual scaffolding accelerate progression to higher-order thinking compared to text-only intervention?

### 1.4 Target Audience
- **Primary**: Higher-education STEM students (introductory university courses — Calculus, Data Structures, Physics).
- **Secondary**: Educators requiring high-fidelity telemetry on self-regulated learning (SRL) for asynchronous review.
- **Tertiary (for eval)**: Research participants in a controlled A/B user study.

### 1.5 Core Features

#### Tier 1: Foundational (Baseline Replication)
- **Dual-Agent Gatekeeping**: Teacher Agent (Agent A) drafts Socratic hints. Auditor Agent (Agent B) evaluates against a strict pedagogical rubric that bars direct answers, enforces Bloom-level targeting, and prevents hallucination.
- **Omni-Source RAG**: PDF, URL, and YouTube transcript ingestion to ground dialogues in specific syllabi.
- **High-Availability Fallback**: Automated switch to Mistral-7B-Instruct (via OpenRouter) on primary API timeout (>8s).

#### Tier 2: Science-Backed Features
- **Generative Cognitive Diagnosis (GCD)**: After each student turn, Agent A performs an open-ended diagnosis — not binary right/wrong — identifying the *specific* latent misconception (e.g., "student conflates correlation with causation in linear regression"). Stored in a structured GCD profile per user.
- **Social Learning via Agent P (Peer Agent)**: Agent P is activated when GCD confidence of a misconception exceeds 0.75. It injects a plausible but incorrect argument *derived directly from that misconception*, forcing the student into a defend-or-revise reasoning state.
- **Script-Driven Orchestration**: Source material is pre-processed into a structured pedagogical script (concept graph + prerequisite map + known misconception seeds) before the session begins. This enables targeted questioning.
- **Instructor Telemetry Dashboard**: Visualizes Bloom's Taxonomy progression per student, chronometric frustration heatmaps per syllabus topic, and Auditor Agent decision logs asynchronously.

#### Tier 3: Novel/Publishable Features
- **Chronometric Cognitive Load Inference (CCLI)**: Frontend passively collects four metrics per message: inter-key interval (IKI) mean, backspace event frequency, cursor-pause events (>2s), and time-to-submit. These are combined into a normalized Cognitive Load Score (CLS, 0.0–1.0) using a weighted formula derived from Paas (1992) and Sweller's CLT. When CLS > 0.7, a signal is sent to Agent B to reduce auditor strictness by one tier (allowing more direct scaffolding). When CLS < 0.3 (high fluency), Agent B increases strictness (forcing deeper reasoning). This is the **Chronometric Adaptive Gate (CAG)**.
- **Misconception-Targeted Epistemic Conflict Generation (MTECG)**: Agent P does not generate generic peer disagreements. It queries the student's GCD profile, retrieves the highest-confidence misconception, and uses a specialized prompt template to synthesize a *peer opinion that is plausibly wrong in exactly the way the student is wrong*. This operationalizes "productive failure" (Kapur, 2016) in a controlled, measurable way.
- **Dynamic Visual Scaffolding (DVS)**: The LangGraph state machine tracks Bloom-tier-per-turn. If the student remains at "Remember" or "Understand" tier for ≥3 consecutive turns on the same concept, it triggers a generative UI component — an interactive SVG diagram or React mini-app — rendered inline in the chat. The visual is generated by a specialized prompt to Claude that specifies the exact misconception and concept, not a generic illustration.

### 1.6 Non-Goals (Explicit Scope Limits)
- No voice/audio interface (deferred to future work).
- No mobile-native app (web-responsive only).
- No integration with external LMS (Canvas, Moodle) in v1.
- No fully automated curriculum generation (lesson planning is out of scope, differentiating from EduPlanner).

---

## PART 2: REVISED TECHNICAL REQUIREMENTS DOCUMENT (TRD v2.0)

### 2.1 System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (Vite + React + TS)           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Source Viewer │  │  Chat UI     │  │ Analytics Dash │  │
│  │ (PDF/YT/Web) │  │ + DVS Inline │  │ (Radar/Heatmap)│  │
│  └──────────────┘  └──────────────┘  └────────────────┘  │
│         ↑                 ↑↓                  ↑           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           CCLI Engine (Web Worker)                  │  │
│  │  Tracks: IKI, backspace_freq, pause_events, TTS     │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTPS + SSE (Streaming)
┌─────────────────────────▼────────────────────────────────┐
│               BACKEND (FastAPI + Uvicorn)                 │
│  ┌────────────────────────────────────────────────────┐   │
│  │           LangGraph Orchestration Engine            │   │
│  │  Node1:Retrieve → Node2:AgentA → Node3:AgentB       │   │
│  │  → [APPROVE] → Node4:Deliver → Node5:Telemetry     │   │
│  │  → [REJECT]  → Node6:Revise  → Node3 (loop≤3)     │   │
│  │  → [PEER_REQ]→ Node7:AgentP  → Node4:Deliver       │   │
│  │  → [BLOOM_STALL] → Node8:DVS → Node4:Deliver       │   │
│  └────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ RAG Service  │  │ GCD Service  │  │ Ingestion Svc  │   │
│  │ (pgvector)   │  │ (Misconc. DB)│  │ (PDF/YT/Web)   │   │
│  └──────────────┘  └──────────────┘  └────────────────┘   │
└──────┬──────────────────┬────────────────────┬────────────┘
       │                  │                    │
┌──────▼──────┐  ┌────────▼──────┐  ┌─────────▼──────────┐
│  Supabase   │  │ Upstash Redis │  │      Neon DB        │
│ (Users,     │  │ (TurnState,   │  │ (Audit Logs,        │
│  GCD,       │  │  Chat Hist.)  │  │  Pedagogy Metrics,  │
│  pgvector)  │  │               │  │  Chronometrics)     │
└─────────────┘  └───────────────┘  └────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Vite 5 + React 18 + TypeScript 5 + Tailwind CSS 3 | Type safety, fast HMR, utility CSS |
| **CCLI Engine** | Web Worker (dedicated thread) | Non-blocking keystroke collection |
| **Backend** | FastAPI 0.115+ (async) + Uvicorn | Async I/O essential for LLM streaming |
| **Orchestration** | LangGraph 0.2+ (StateGraph) | Deterministic routing, cycle support |
| **Primary LLM** | Mistral Large 2 (via Mistral API) | Strong reasoning, affordable at scale |
| **DVS Generator** | claude-sonnet-4-20250514 via Anthropic API | Best-in-class React/SVG code generation |
| **Fallback LLM** | Mistral-7B-Instruct (OpenRouter) | Free-tier, local-compatible |
| **Embeddings** | text-embedding-3-small (OpenAI) | 1536-dim, pgvector compatible |
| **Primary DB** | Supabase (PostgreSQL 15 + pgvector) | Auth, relational data, vector search |
| **Cache/State** | Upstash Redis | Sub-ms latency for live session state |
| **Telemetry DB** | Neon DB (Serverless Postgres) | Async ingestion, no main-thread block |
| **PDF Parsing** | PyMuPDF | Fast, accurate PDF text extraction |
| **Web Scraping** | BeautifulSoup4 + httpx | Async-compatible |
| **YT Transcripts** | youtube-transcript-api | YouTube subtitle extraction |
| **Validation** | Pydantic v2 + json-repair | Strict output parsing for agent JSON |
| **Auth** | Supabase Auth (OAuth + Email/Pass) | Row-level security, JWT tokens |
| **Deployment** | Docker Compose (dev) / Railway or Render (prod) | One-command deployment |

### 2.3 LangGraph State Machine (Detailed)

```python
from typing import TypedDict, Optional, List, Literal
from langchain_core.messages import BaseMessage

class TutoringState(TypedDict):
    # Session context
    session_id: str
    user_id: str
    messages: List[BaseMessage]
    
    # RAG context
    context_chunks: str
    pedagogical_script: str  # Pre-generated at session start
    
    # Cognitive load (from frontend CCLI engine)
    chronometric_load_score: float      # 0.0 (fluent) – 1.0 (frustrated)
    chronometric_raw: dict              # {iki_mean, backspace_freq, pause_count, tts}
    
    # Agent state
    draft_hint: Optional[str]
    draft_gcd: Optional[dict]           # {misconception: str, confidence: float, bloom_tier: str}
    audit_decision: Optional[Literal["APPROVE", "REJECT", "PEER_REQUIRED", "DVS_REQUIRED"]]
    audit_feedback: Optional[str]
    loop_count: int                     # Max 3 revision loops
    
    # GCD & Peer
    active_misconception: Optional[str] # Pulled from GCD DB for Agent P
    peer_argument: Optional[str]
    
    # Bloom tracking
    bloom_tier: str                     # Current detected tier
    bloom_stall_count: int              # Consecutive turns at same tier/concept
    
    # DVS
    dvs_component_code: Optional[str]  # Generated React/SVG code
    dvs_triggered: bool

# Routing function
def route_after_audit(state: TutoringState) -> str:
    decision = state["audit_decision"]
    if decision == "APPROVE":
        return "deliver_and_log"
    elif decision == "REJECT" and state["loop_count"] < 3:
        return "revise_draft"
    elif decision == "REJECT" and state["loop_count"] >= 3:
        return "deliver_and_log"  # Deliver best draft after max loops
    elif decision == "PEER_REQUIRED":
        return "agent_p_inject"
    elif decision == "DVS_REQUIRED":
        return "generate_dvs"
    return "deliver_and_log"
```

### 2.4 Agent Prompt Architecture

**Agent A (Teacher) System Prompt Structure:**
```
You are a Socratic tutor. Your ONLY job is to help the student discover the answer themselves.

RULES (enforced by Auditor Agent B — violation causes rejection):
1. NEVER state the answer directly.
2. Always ask one focused question that moves the student one step forward.
3. Tag every response with: bloom_tier (Remember/Understand/Apply/Analyze/Evaluate/Create),
   misconception (if detected), confidence (0.0-1.0), suggested_next_action.
4. Current cognitive load score: {chronometric_load_score}. 
   If > 0.7: Use simpler language, shorter questions, more affirmation.
   If < 0.3: Push for deeper reasoning, ask "why" and "what if" questions.

Student GCD Profile: {gcd_profile}
Context: {context_chunks}
Pedagogical Script: {pedagogical_script}

Respond in JSON: {hint, bloom_tier, misconception, confidence, rationale}
```

**Agent B (Auditor) System Prompt Structure:**
```
You are a strict pedagogical auditor. Evaluate the Teacher Agent's draft against these criteria:

REJECTION CRITERIA (any one fails = REJECT):
- Direct answer given (score: 0)
- Question is ambiguous or has >1 correct interpretation
- Response ignores the student's detected misconception
- Bloom tier regression without justification
- Response is condescending or dismissive

PEER_REQUIRED if: misconception confidence > 0.75 AND student has been corrected on same issue >2 times
DVS_REQUIRED if: bloom_stall_count >= 3 AND bloom_tier in [Remember, Understand]

Chronometric Load: {chronometric_load_score}
If load > 0.7: Relax criteria #3 (allow slightly more explicit scaffolding)

Output JSON: {decision: APPROVE|REJECT|PEER_REQUIRED|DVS_REQUIRED, feedback: str}
```

**Agent P (Peer) System Prompt Structure:**
```
You are a well-meaning but subtly wrong student peer.

The target student has the following SPECIFIC misconception: "{active_misconception}"
This misconception has persisted for {misconception_recurrence_count} turns.

Your job: Express an opinion that is plausible but wrong IN EXACTLY THE SAME WAY as this misconception.
Do NOT be obviously wrong. You must sound confident and cite a plausible reason.
Do NOT use jargon the student hasn't used.
Keep your message to 2–3 sentences maximum.
End with a question directed at the student: "Does that make sense to you?"
```

### 2.5 CCLI Algorithm (Frontend)

```typescript
// web-worker/ccli.worker.ts
interface ChronometerEvent {
  type: 'keydown' | 'keyup' | 'pause' | 'submit';
  timestamp: number;
  key?: string;
}

function computeCLS(events: ChronometerEvent[]): number {
  const keydowns = events.filter(e => e.type === 'keydown');
  const backspaces = keydowns.filter(e => e.key === 'Backspace').length;
  const totalKeys = keydowns.length;
  
  // Inter-key interval (IKI) — higher = more hesitation
  const ikis: number[] = [];
  for (let i = 1; i < keydowns.length; i++) {
    ikis.push(keydowns[i].timestamp - keydowns[i-1].timestamp);
  }
  const ikiMean = ikis.length > 0 ? ikis.reduce((a,b) => a+b, 0) / ikis.length : 0;
  
  // Pause events (cursor stationary >2000ms between keystrokes)
  const pauseCount = ikis.filter(iki => iki > 2000).length;
  
  // Time to submit (TTS) — from first keystroke to submit
  const firstKey = keydowns[0]?.timestamp ?? 0;
  const submitEvent = events.find(e => e.type === 'submit');
  const tts = submitEvent ? submitEvent.timestamp - firstKey : 0;
  
  // Weighted CLS formula (normalized 0–1)
  // Weights derived from Sweller CLT proxy literature
  const backspace_score = Math.min(backspaces / Math.max(totalKeys, 1), 1.0);
  const iki_score = Math.min(ikiMean / 3000, 1.0);       // >3s IKI = max load
  const pause_score = Math.min(pauseCount / 5, 1.0);     // 5+ pauses = max load  
  const tts_score = Math.min(tts / 120000, 1.0);         // >2min = max load
  
  return (
    0.30 * backspace_score +
    0.30 * iki_score +
    0.20 * pause_score +
    0.20 * tts_score
  );
}
```

---

## PART 3: REVISED BACKEND SCHEMA (v2.0)

### 3.1 Supabase (PostgreSQL + pgvector)

```sql
-- Auth is handled by Supabase Auth (auth.users table)

CREATE TABLE public.learner_profiles (
  profile_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  role          TEXT DEFAULT 'student' CHECK (role IN ('student', 'instructor')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.sessions (
  session_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  ended_at      TIMESTAMPTZ
);

CREATE TABLE public.documents (
  doc_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES public.sessions(session_id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  source_type   TEXT NOT NULL CHECK (source_type IN ('pdf', 'url', 'youtube')),
  source_url    TEXT,
  raw_text      TEXT,
  ped_script    JSONB,   -- Pedagogical script: {concept_graph, prereqs, misconception_seeds}
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.document_embeddings (
  chunk_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id        UUID NOT NULL REFERENCES public.documents(doc_id) ON DELETE CASCADE,
  chunk_index   INT NOT NULL,
  content       TEXT NOT NULL,
  embedding     vector(1536),  -- pgvector
  metadata      JSONB          -- {page, section, bloom_estimate}
);
CREATE INDEX ON public.document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE public.gcd_profiles (
  -- One row per unique (user_id, misconception_key) pair
  gcd_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id          UUID REFERENCES public.sessions(session_id),
  misconception_key   TEXT NOT NULL,   -- e.g. "confuses_correlation_causation"
  misconception_text  TEXT NOT NULL,   -- Full natural language description
  confidence          FLOAT NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  recurrence_count    INT DEFAULT 1,
  last_detected_at    TIMESTAMPTZ DEFAULT now(),
  resolved            BOOLEAN DEFAULT FALSE,
  UNIQUE (user_id, misconception_key)
);

CREATE TABLE public.learner_models (
  model_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_register TEXT DEFAULT 'formal',
  overall_level    INT DEFAULT 3 CHECK (overall_level BETWEEN 1 AND 5),
  dominant_bloom   TEXT DEFAULT 'Remember',
  updated_at       TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 Upstash Redis (Ephemeral Session State)

```
Key: session:{session_id}:history
Value: JSON array of last 20 messages [{role, content, bloom_tier, cls_score}]
TTL: 24 hours

Key: session:{session_id}:graph_state
Value: JSON serialized TutoringState (without messages, stored separately)
TTL: 4 hours of inactivity

Key: session:{session_id}:bloom_tracker
Value: JSON {current_tier, stall_count, concept_key, turn_history: [...]}
TTL: 24 hours

Key: user:{user_id}:rate_limit
Value: Integer (request count)
TTL: 60 seconds (sliding window rate limit: 30 req/min)
```

### 3.3 Neon DB (Time-Series Telemetry — Async Write)

```sql
CREATE TABLE audit_logs (
  log_id              BIGSERIAL PRIMARY KEY,
  session_id          UUID NOT NULL,
  user_id             UUID NOT NULL,
  turn_number         INT NOT NULL,
  timestamp           TIMESTAMPTZ DEFAULT now(),
  agent_a_draft       TEXT,
  agent_a_gcd         JSONB,          -- {misconception, confidence, bloom_tier}
  agent_b_decision    TEXT NOT NULL,  -- APPROVE | REJECT | PEER_REQUIRED | DVS_REQUIRED
  agent_b_feedback    TEXT,
  loop_iterations     INT DEFAULT 0,
  peer_injected       BOOLEAN DEFAULT FALSE,
  dvs_triggered       BOOLEAN DEFAULT FALSE
);

CREATE TABLE pedagogy_metrics (
  metric_id               BIGSERIAL PRIMARY KEY,
  session_id              UUID NOT NULL,
  user_id                 UUID NOT NULL,
  turn_number             INT NOT NULL,
  timestamp               TIMESTAMPTZ DEFAULT now(),
  bloom_tier              TEXT NOT NULL,
  bloom_stall_count       INT DEFAULT 0,
  
  -- CCLI raw data
  cls_score               FLOAT,
  iki_mean_ms             FLOAT,
  backspace_frequency     FLOAT,
  pause_count             INT,
  time_to_submit_ms       BIGINT,
  
  -- Adaptive gate record
  cag_applied             BOOLEAN DEFAULT FALSE,  -- Did CAG fire?
  cag_direction           TEXT,                   -- 'relaxed' | 'tightened'
  
  -- Misconception tracking
  identified_misconception TEXT,
  misconception_confidence FLOAT
);

CREATE TABLE dvs_events (
  dvs_id        BIGSERIAL PRIMARY KEY,
  session_id    UUID NOT NULL,
  user_id       UUID NOT NULL,
  turn_number   INT NOT NULL,
  timestamp     TIMESTAMPTZ DEFAULT now(),
  concept       TEXT,
  bloom_tier    TEXT,
  stall_count   INT,
  component_type TEXT   -- 'svg_diagram' | 'react_interactive'
);

-- Indexes for analytics queries
CREATE INDEX idx_pedagogy_user_session ON pedagogy_metrics(user_id, session_id);
CREATE INDEX idx_audit_session ON audit_logs(session_id);
CREATE INDEX idx_pedagogy_bloom ON pedagogy_metrics(bloom_tier, user_id);
```

---

## PART 4: APPLICATION FLOW (Full Production Website)

### 4.1 Phase 1 — Onboarding & Authentication

```
User hits https://maes.app/
│
├─ /login  →  Supabase OAuth (Google) or Email/Password
│             On success: JWT token stored in httpOnly cookie
│             Middleware validates on every request
│
└─ /register → Email + role selection (Student / Instructor)
               Triggers: learner_profiles INSERT + learner_models INSERT (defaults)
```

### 4.2 Phase 2 — Dashboard (/)

After login, user lands on the **Workspace Dashboard**:

**Left Sidebar**: Navigation (Sessions, Insights, Settings)

**Main Area — Active Session Cards**: Each card shows:
  - Session title, subject, last active timestamp
  - Mini Bloom radar (5-segment: R/U/Ap/An/Ev)
  - Dominant misconception badge (if any from GCD)
  - "Resume" / "View Insights" buttons

**Top Bar**:
  - "+ New Session" button (prominent, indigo-600)
  - User avatar with role badge

### 4.3 Phase 3 — Session Creation (/session/new)

```
Step 1: Title & Subject
  ┌─────────────────────────────────────┐
  │ Session Title: [________________]   │
  │ Subject Area: [Dropdown]            │
  │              (Math / CS / Physics / │
  │               Chemistry / Other)   │
  └─────────────────────────────────────┘

Step 2: Upload Source Material (ONE of):
  ┌───────────────────────────────────────────────────────┐
  │  [📄 Upload PDF]  [🌐 Paste URL]  [▶️ YouTube URL]   │
  └───────────────────────────────────────────────────────┘
  On submit → POST /api/ingest
              Background task: Extract text → Chunk (512 tokens, 64 overlap)
              → Embed (text-embedding-3-small) → Insert document_embeddings
              → Generate pedagogical_script (concept graph + misconception seeds)
              → Update sessions.status = 'ready'
              Frontend: polls GET /api/session/{id}/status every 2s
              Shows: "Preparing your tutor... (Analyzing source)" with progress bar

Step 3: Optional — Learner Configuration
  ┌─────────────────────────────────────────────────────┐
  │ "How familiar are you with this topic?"             │
  │ ○ Complete beginner  ○ Some exposure  ○ Intermediate│
  │ ○ Advanced                                          │
  │ [Start Session →]                                   │
  └─────────────────────────────────────────────────────┘
  → Sets learner_models.overall_level for this session
```

### 4.4 Phase 4 — Active Learning Loop (/session/{id})

**Layout: Split Pane (30/70)**

```
┌──────────────────────────────────────────────────────────────┐
│ TOOLBAR: [Session Title] [Bloom Tier Badge] [CLS Indicator]  │
│          [End Session] [Insights] [Source Toggle]            │
├───────────────────────────┬──────────────────────────────────┤
│   SOURCE VIEWER (30%)     │      CHAT INTERFACE (70%)        │
│                           │                                  │
│  [PDF Renderer]           │  ┌──────────────────────────┐   │
│  [YouTube Embed]          │  │ 🎓 Tutor (Agent A)        │   │
│  [Web Text Viewer]        │  │ "Let's think about this   │   │
│                           │  │  step by step. What do   │   │
│  Highlight synced:        │  │  you think happens when  │   │
│  When tutor refs a        │  │  x approaches 0?"        │   │
│  specific section,        │  └──────────────────────────┘   │
│  it highlights here       │                                  │
│                           │  ┌──────────────────────────┐   │
│                           │  │ 👤 You                    │   │
│                           │  │ "I think the limit is    │   │
│                           │  │  infinity"               │   │
│                           │  └──────────────────────────┘   │
│                           │                                  │
│                           │  ── Agent P Intervention ──    │
│                           │  ┌──────────────────────────┐   │
│                           │  │ 👥 Peer (Alex)            │   │
│                           │  │ [emerald bubble]          │   │
│                           │  │ "Actually, I think you're │   │
│                           │  │  right — if x gets really │   │
│                           │  │  small, the output just   │   │
│                           │  │  grows without bound,     │   │
│                           │  │  doesn't it?"             │   │
│                           │  └──────────────────────────┘   │
│                           │                                  │
│                           │  ── DVS Visual (if triggered) ─│
│                           │  ┌──────────────────────────┐   │
│                           │  │ 📊 [Interactive SVG/React]│   │
│                           │  │    Concept visualization  │   │
│                           │  │    with draggable inputs  │   │
│                           │  └──────────────────────────┘   │
│                           │                                  │
│                           │  [Thought workspace indicator]   │
│                           │  ⚙️ "Evaluating pedagogical    │
│                           │      strategy..." (when loading) │
│                           │                                  │
│                           │  ┌──────────────────────────┐   │
│                           │  │ Type your answer...      │   │
│                           │  │                    [Send] │   │
│                           │  └──────────────────────────┘   │
└───────────────────────────┴──────────────────────────────────┘
```

**Message Payload (Frontend → Backend):**
```typescript
interface ChatRequest {
  session_id: string;
  message: string;
  chronometrics: {
    cls_score: number;
    iki_mean_ms: number;
    backspace_frequency: number;
    pause_count: number;
    time_to_submit_ms: number;
  };
}
```

**Backend Message Handler (FastAPI):**
```python
@router.post("/api/chat/{session_id}")
async def chat(session_id: str, req: ChatRequest, user=Depends(get_current_user)):
    # 1. Load state from Redis
    state = await redis.get(f"session:{session_id}:graph_state")
    
    # 2. Append new message to state
    state["messages"].append(HumanMessage(req.message))
    state["chronometric_load_score"] = req.chronometrics.cls_score
    state["chronometric_raw"] = req.chronometrics.dict()
    
    # 3. Run LangGraph (streaming)
    return StreamingResponse(
        run_graph_stream(state),
        media_type="text/event-stream"
    )
```

**Streaming Response Events (SSE):**
```
event: thinking
data: {"status": "Evaluating pedagogical strategy..."}

event: message_chunk
data: {"content": "That's an interesting observation. ", "agent": "tutor"}

event: message_chunk  
data: {"content": "What happens if instead of x=0, ", "agent": "tutor"}

event: bloom_update
data: {"bloom_tier": "Understand", "stall_count": 2}

event: peer_message
data: {"content": "...", "agent": "peer", "peer_name": "Alex"}

event: dvs_component
data: {"code": "<svg>...</svg>", "concept": "limit definition"}

event: done
data: {"gcd_update": {...}, "cls_score": 0.72}
```

### 4.5 Phase 5 — Async Telemetry Pipeline

After every delivered turn:
```
FastAPI background task →
  asyncio.create_task(log_to_neon(audit_data)) →
    Neon DB: INSERT INTO audit_logs (non-blocking)
    Neon DB: INSERT INTO pedagogy_metrics (non-blocking)
    Supabase: UPSERT gcd_profiles (misconception update, non-blocking)
    Supabase: UPDATE learner_models.dominant_bloom (non-blocking)
```

This never blocks the main response path. The frontend receives the tutor message before telemetry is flushed.

### 4.6 Phase 6 — Analytics Dashboard (/insights)

**Student View:**
- **Bloom Radar Chart** (Recharts): 6-axis radar showing mastery score per Bloom tier across all sessions. Updates after each session.
- **CLS Heatmap** (D3.js): Session timeline with color-coded cognitive load. Correlates high-CLS turns with syllabus topics — shows "where you struggled most."
- **GCD Misconception Timeline**: List of identified misconceptions, each with a recurrence graph and "resolved" status.
- **Turn Replay**: Ability to click any session turn and see the full agent trace (Agent A draft → Agent B decision → delivered message).

**Instructor View** (role='instructor'):
- Aggregate class Bloom distribution (bar chart per student)
- Misconception frequency heatmap across class (which concepts trip students up most)
- Individual student drill-down
- Exportable CSV of all pedagogy_metrics

### 4.7 Phase 7 — Session End

```
User clicks "End Session" →
  POST /api/session/{id}/end →
    UPDATE sessions SET status='completed', ended_at=now()
    Redis: DELETE session state keys
    Trigger: Background summary generation
      → Agent A (summarizer mode) generates a learning summary:
         {mastered_concepts, persistent_misconceptions, recommended_review}
      → Stored in sessions.summary (JSONB)
    Redirect → /session/{id}/summary (shows the learning report)
```

---

## PART 5: UI/UX SPECIFICATION (Production-Grade)

### 5.1 Design Tokens

```css
/* Primary Palette */
--color-bg:           #fafafa;   /* neutral-50 */
--color-surface:      #ffffff;
--color-primary:      #4f46e5;   /* indigo-600 */
--color-primary-dark: #3730a3;   /* indigo-800 */
--color-border:       #e2e8f0;   /* slate-200 */

/* Agent Bubbles */
--color-tutor-bg:     #f1f5f9;   /* slate-100 */
--color-peer-bg:      #ecfdf5;   /* emerald-50 */
--color-peer-border:  #6ee7b7;   /* emerald-300 */
--color-student-bg:   #eef2ff;   /* indigo-50 */

/* Bloom Tier Colors */
--bloom-remember:     #6b7280;   /* gray-500 */
--bloom-understand:   #3b82f6;   /* blue-500 */
--bloom-apply:        #10b981;   /* emerald-500 */
--bloom-analyze:      #f59e0b;   /* amber-500 */
--bloom-evaluate:     #ef4444;   /* red-500 */
--bloom-create:       #8b5cf6;   /* violet-500 */

/* CLS Indicator */
--cls-low:            #22c55e;   /* green-500 — fluent */
--cls-mid:            #f59e0b;   /* amber-500 — moderate */
--cls-high:           #ef4444;   /* red-500 — frustrated */

/* Typography */
--font-ui:     'Inter', sans-serif;
--font-reading: 'Merriweather', 'Georgia', serif;
--font-code:   'JetBrains Mono', 'Fira Code', monospace;
```

### 5.2 CLS Indicator Component

```
[●] CLS: 0.23 (LOW)    → Green dot, "Fluent thinking"
[●] CLS: 0.58 (MID)    → Amber dot, "Working through it"
[●] CLS: 0.82 (HIGH)   → Red dot, "High cognitive effort"
```
This is visible in the toolbar to the student — providing metacognitive awareness of their own effort.

### 5.3 DVS Trigger Animation

When DVS fires, the chat scrolls and a card expands with a subtle fade-in:
```
┌─────────────────────────────────────────────────────┐
│ 📊 Visual Concept: Limit of 1/x as x→0              │
│ ──────────────────────────────────────────────────  │
│    [Interactive SVG: Drag the x slider →]           │
│    Watch how f(x) behaves near zero                 │
│                                                     │
│  [This was generated because you've spent 3 turns   │
│   on this concept — sometimes seeing helps more!]   │
└─────────────────────────────────────────────────────┘
```

---

## PART 6: IEEE TLT SUBMISSION STRATEGY

### 6.1 Paper Structure Recommendation

| Section | Content |
|---|---|
| **Abstract** | 3 novel mechanisms + RQ framing + brief empirical result teaser |
| **Introduction** | Gap in existing ITS: no system combines passive load sensing + targeted conflict + modality shift |
| **Related Work** | EduPlanner (diff: lesson planning, not tutoring), SocraticLM (diff: single agent, no auditor), DiaCDM (diff: offline diagnosis), IntelliCode (diff: no load sensing or DVS) |
| **System Architecture** | LangGraph state machine, agent prompts, CCLI algorithm |
| **Novel Mechanisms** | CAG, MTECG, DVS — each with formal definition |
| **Evaluation** | Pilot user study: N=30 students, 3 conditions (Full MAES / No-Agent-P / No-CCLI), pre/post test on a STEM topic, Bloom progression analysis |
| **Results & Discussion** | Statistical comparison, qualitative interview findings |
| **Conclusion** | Limitations (no longitudinal study yet), future work (voice, mobile) |

### 6.2 Differentiators to Emphasize in Submission

1. **MAES is the first ITS to use passive chronometric signals (not surveys or explicit feedback) to adapt agent behavior in real time.** (Differentiates from all existing load-adaptive systems that use surveys or self-reports.)

2. **MAES is the first ITS where a peer agent generates misconception-targeted epistemic conflicts, not generic disagreements.** (Differentiates from all multi-agent systems including EduPlanner, IntelliCode.)

3. **MAES automatically shifts learning modality (text → interactive visual) based on Bloom stall detection, with the visual content generated to target the specific detected misconception — not a generic illustration.** (Completely novel in ITS literature.)

### 6.3 Recommended Evaluation Metrics

| Metric | Measurement Method |
|---|---|
| Learning gain | Pre/post Bloom-tagged test, normalized gain (Hake, 1998) |
| Misconception resolution rate | GCD profile: % resolved after session |
| Session completion rate | Sessions with ≥10 turns / total sessions started |
| Engagement depth | Average Bloom tier reached per session |
| CAG efficacy | CLS score distribution before/after CAG-adjusted turns |
| DVS efficacy | Bloom tier transition rate in turns following DVS vs not |

---

*This document is structured for implementation. The next step is to set up the monorepo: `/frontend` (Vite+React+TS), `/backend` (FastAPI+LangGraph), `/infra` (Docker Compose + Supabase migrations).*
