# MAES — Backend Implementation Plan

## 1. Technology Stack
- **Framework**: FastAPI (Python 3.10+)
- **Server**: Uvicorn
- **Primary Database**: Supabase (PostgreSQL) - via `supabase` python client
- **Audit Database**: Neon DB (Serverless Postgres) - via `asyncpg`
- **Session Cache**: Upstash Redis - via `upstash-redis`
- **Agent Orchestration**: LangGraph (v1.0+)
- **LLM APIs**: Groq (Llama-3), Google Generative AI (Gemini Flash), OpenRouter (Mistral)
- **Source Processing**: BeautifulSoup4, PyMuPDF, youtube-transcript-api
- **Hosting**: Render (Web Service via Docker)

## 2. Core Systems Architecture

### Multi-Agent Orchestration (LangGraph)
- **Agent A (Socratic Tutor)**: Uses Groq (`llama-3.1-8b-instant`) for fast, cheap draft generation.
- **Agent B (Pedagogical Auditor)**: Uses Gemini (`gemini-1.5-flash`) for complex rubric evaluation and validation.
- **Workflow**: 
  1. Student message -> Agent A (Draft)
  2. Draft -> Agent B (Audit)
  3. If approved -> Send to student.
  4. If rejected -> Inject correction signal -> Agent A (Revise) -> Send to student.
- **Fallback Chain**: If Groq or Gemini hit 429 limits, logic falls back to Mistral via OpenRouter.

### Data & Caching Flow
- **Active Sessions**: State and conversational context are heavily cached in Upstash Redis to minimize DB roundtrips during typing.
- **Audit Logging**: Every agent decision and rubric score is appended to Neon DB immediately.
- **State Write-back**: On session end, Redis cache is flushed and the persistent `learner_models` row in Supabase is updated.

## 3. Application Structure
```text
backend/
├── app/
│   ├── main.py                  # FastAPI app init & CORS
│   ├── config.py                # Pydantic Settings & Env vars
│   ├── routes/
│   │   ├── session.py           # Start/End sessions
│   │   ├── turn.py              # LangGraph invocation endpoint
│   │   ├── audit.py             # Query Neon audit logs
│   │   ├── simulate.py          # Adversarial simulation runner
│   │   ├── sources.py           # PDF/URL/YouTube text extraction
│   │   ├── notebooks.py         # Notebook CRUD
│   │   └── studio.py            # Async generation of flashcards/quizzes
│   ├── agents/
│   │   ├── agent_a.py           # Groq integration
│   │   ├── agent_b.py           # Gemini integration
│   │   ├── agent_s.py           # Simulated student
│   │   └── orchestrator.py      # LangGraph state graph definition
│   ├── services/
│   │   ├── source_processor.py  # Logic for beautifulsoup/pymupdf
│   │   ├── flashcard_gen.py     # Extraction chains for studio
│   │   └── json_utils.py        # Robust JSON repair & retry logic
│   ├── db/
│   │   ├── supabase_client.py
│   │   ├── neon_client.py
│   │   ├── upstash_client.py
│   │   └── models.py            # Pydantic validation schemas
│   └── middleware/
│       └── auth.py              # JWT validation via Supabase
├── requirements.txt
└── Dockerfile
```

## 4. Key Implementation Phases
1. **DB & Cache Setup**: Connect `supabase_client`, `neon_client`, and `upstash_client`. Validate schema integrations.
2. **LLM & Agents**: Implement `agent_a.py` and `agent_b.py`. Build the robust JSON parser in `json_utils.py` to handle LLM quirks.
3. **LangGraph Pipeline**: Define the `TurnState` and compile the LangGraph in `orchestrator.py`. Ensure async compatibility.
4. **API Routes**: Expose `/turn` and `/session` endpoints. Implement JWT middleware to ensure secure access.
5. **Source Processing**: Implement the `sources.py` endpoints to download, parse, and clean text from PDFs and URLs.
6. **Studio Generators**: Implement specific LLM calls that take session history and generate structured JSON for flashcards/quizzes.

## 5. Deployment
- Containerized using `Dockerfile` (Python 3.11-slim base).
- Deployed to Render via GitHub Actions `.github/workflows/deploy-backend.yml` triggering a webhook on push.
