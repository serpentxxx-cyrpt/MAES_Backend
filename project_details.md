# Project Details: Multi-Agent Pedagogical System with Socratic Tutoring (MAES)

Here is a detailed breakdown of the project implemented so far, based on the current state of the repository.

## 1. List of Features Implemented
- **Multi-Agent Socratic Tutoring System**: A specialized tutoring backend where an AI Teacher proposes answers and an AI Auditor verifies them.
- **Session Management**: Secure creation and termination of learning sessions, tracking user IDs, and domain specifics.
- **Dynamic Source Processing (RAG capabilities)**: The system can ingest multiple document types to provide context to the LLMs:
  - **PDFs**: Text extraction using PyMuPDF (`fitz`).
  - **Websites**: Scraping and text extraction using `BeautifulSoup4`.
  - **YouTube**: Direct video transcript extraction via `youtube_transcript_api`.
- **Robust Fallback Mechanism**: A Fallback Agent (Agent S) automatically takes over if the primary tutoring pipeline fails or times out.
- **Audit Logging**: Comprehensive logging of pedagogical decisions, bloom tags, and rubric scores to a remote database (Neon DB).
- **Studio & Simulation Tools**: Endpoints to manage notebooks, simulate conversations, and manage raw sources.

## 2. AI Models and Modern Frameworks
- **LangGraph Orchestration**: The core multi-agent interaction is modeled as a state machine using LangGraph (`StateGraph`), allowing cyclical revisions between the Teacher and Auditor.
- **AI Models in Use**:
  - **Agent A (Teacher)**: Powered by `mistral-large-latest` (via Mistral API). Generates draft hints, internal reasoning, and estimates Bloom taxonomy levels.
  - **Agent B (Auditor)**: Powered by `mistral-large-latest` (via Mistral API). Audits Agent A's output based on a pedagogical rubric (hint quality, tone, correctness, bloom alignment).
  - **Agent S (Fallback)**: Powered by `mistralai/mistral-7b-instruct:free` (via OpenRouter). Acts as a lightweight, fast fallback if the main pipeline crashes.
- **JSON Repair Toolkit**: Integration with `json-repair` to ensure that malformed LLM JSON outputs are gracefully recovered instead of throwing system-breaking exceptions.

## 3. Pipeline Sequence, Memory Recalls & Document Parsing
### Multi-Agent Pipeline Sequence
1. **Entry (`agent_a`)**: The student's message and contextual sources are sent to Agent A, which generates a JSON draft containing a `hint_text` and `estimated_bloom_level`.
2. **Audit (`agent_b`)**: Agent B receives Agent A's draft and evaluates it against strict pedagogical rubrics. It outputs a decision: `APPROVE`, `REQUEST_REVISION`, or `SWITCH_REGISTER`.
3. **Signal Injection (`inject_signal`)**: Audit scores, bloom tags, and decisions are asynchronously logged to Neon DB. The state is updated with correction signals.
4. **Conditional Routing (`route_after_audit`)**:
   - If `APPROVE`, the graph ends (`END`), and the hint is served to the student.
   - If `REQUEST_REVISION`, the graph loops back to a `revise` node (re-running Agent A with the correction notes), which then passes back to Agent B for re-evaluation. A loop limit protects against infinite cycles.

### Memory Recalls
- **Upstash Redis (Short-Term)**: Maintains the active `TurnState` and dialogue history per session. Ensures ultra-fast retrieval during an active conversation.
- **Supabase PostgreSQL (Long-Term)**: Stores the `learner_model`. When a session starts, the backend retrieves the student's `preferred_style` (register) and historical progress, injecting this context directly into the Redis session cache.

### Document & JSON Parsing
- **JSON Parsing**: The system utilizes a specialized `repair_and_parse_json` utility. It aggressively cleans markdown wrappings (like ````json ... ````) and uses the `json-repair` library as a final failsafe to reconstruct structurally flawed JSON outputs from the LLMs.
- **Document Context**: Uploaded documents are parsed into raw text strings and injected directly into the active prompt's `active_sources` variable. A strict system prompt enforces that the LLMs must utilize the provided text.

## 4. System Design and Tech Stack
The architecture follows a decoupled frontend-backend model with dedicated infrastructure for caching, permanent storage, and high-throughput logging.

### Backend Tech Stack
- **API Framework**: FastAPI, running on Uvicorn with asynchronous endpoints.
- **Data Validation**: Pydantic for request/response schemas and settings management.
- **Orchestration**: LangGraph for building the agentic state machines.
- **LLM Clients**: Asynchronous standard clients (`openai` wrapper configured for Mistral/OpenRouter endpoints).
- **Databases**: 
  - **Supabase**: Primary persistent storage for Users, Sessions, and Learner Models.
  - **Neon DB**: Fast serverless PostgreSQL used exclusively for high-volume audit logging.
- **Caching**: Upstash Redis for rapid session state and history retrieval.
- **Scraping / Source Tools**: `BeautifulSoup4`, `pypdf`, `youtube-transcript-api`.

### Frontend Tech Stack (Current Setup)
- **Framework**: Vite + React + TypeScript (`tsconfig.json`, `vite.config.ts`).
- **Styling**: Tailwind CSS (`tailwind.config.js`, `postcss.config.js`).
- **Package Management**: npm (`package-lock.json`, `package.json`).
- **Code Quality**: ESLint (`eslint.config.js`).
