"""
Adversarial Simulation (Component 7)
Blueprint: Implement adversarial simulation endpoint - synthetic student (Groq Llama 3.1 8B) 
runs n_turns against the orchestrator and returns aggregated rubric scores.
"""
import json
import logging
from fastapi import APIRouter
from groq import AsyncGroq

from app.db.models import SimulateRequest
from app.db.supabase_client import get_supabase
from app.config import settings

router = APIRouter(prefix="/simulate", tags=["Simulation"])
logger = logging.getLogger(__name__)

SYNTHETIC_STUDENT_SYSTEM = """You are a synthetic student with genuine conceptual misunderstandings about the given topic.
Your job is to ask questions that a confused student would ask — not too simple, not too advanced.
Vary your questions: sometimes show partial understanding, sometimes make a common misconception explicit.
Respond with a single student message (plain text, no JSON, no labels, just the message itself)."""


@router.post("")
async def run_simulation(req: SimulateRequest):
    """
    Runs an adversarial simulation: a synthetic Groq student vs the real orchestrator.
    Returns a report with per-turn rubric scores and aggregate statistics.
    """
    # Get source context for the notebook
    context_text = ""
    if req.notebook_id:
        sb = get_supabase()
        if sb:
            res = sb.table("sources").select("raw_content, title").eq("notebook_id", req.notebook_id).eq("is_active", True).execute()
            if res.data:
                context_text = "\n\n".join([f"--- {r['title']} ---\n{r.get('raw_content', '')[:2000]}" for r in res.data])[:8000]

    topic = req.topic or "the subject covered in the notebook"
    groq_client = AsyncGroq(api_key=settings.groq_api_key)
    
    dialogue_history = []
    turn_reports = []
    
    for turn_i in range(req.n_turns):
        # 1. Synthetic student generates a message
        student_ctx = f"Topic: {topic}\nDialogue so far:\n" + "\n".join([
            f"{'Student' if m['role'] == 'student' else 'Tutor'}: {m['text']}"
            for m in dialogue_history[-6:]
        ])
        
        try:
            student_resp = await groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": SYNTHETIC_STUDENT_SYSTEM},
                    {"role": "user", "content": student_ctx}
                ],
                temperature=0.8,
                max_tokens=200
            )
            student_message = student_resp.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"[SIMULATE] Synthetic student failed on turn {turn_i}: {e}")
            student_message = f"I'm confused about {topic}. Can you explain it differently?"

        # 2. Run Agent A + B manually (without full graph to avoid side effects)
        from app.agents.agent_a import run_agent_a
        from app.agents.agent_b import run_agent_b
        from app.middleware.sanitizer import sanitize_student_input, wrap_for_llm
        
        safe_message = wrap_for_llm(sanitize_student_input(student_message))
        sim_state = {
            "session_id": f"sim-{req.notebook_id}-{turn_i}",
            "student_id": "simulation-agent",
            "student_message": safe_message,
            "learner_model": {},
            "current_register": "socratic",
            "turn_number": turn_i + 1,
            "dialogue_history": dialogue_history,
            "agent_a_draft": None,
            "agent_b_result": None,
            "agent_b_signal": None,
            "loop_count": 0,
            "chronometric_load_score": 0.3,
            "bloom_stall_count": 0,
            "active_misconception": None,
            "dvs_payload": None,
            "peer_challenge": False,
            "active_sources": context_text,
            "audit_logs_to_dispatch": []
        }
        
        try:
            state_after_a = await run_agent_a(sim_state)
            state_after_b = await run_agent_b(state_after_a)
        except Exception as e:
            logger.error(f"[SIMULATE] Agent run failed on turn {turn_i}: {e}")
            turn_reports.append({"turn": turn_i + 1, "student_message": student_message, "error": str(e)})
            continue
        
        hint = (state_after_a.get("agent_a_draft") or {}).get("hint_text", "")
        b_result = state_after_b.get("agent_b_result") or {}
        scores = b_result.get("rubric_scores", {})
        
        turn_reports.append({
            "turn": turn_i + 1,
            "student_message": student_message,
            "tutor_hint": hint[:200],
            "decision": b_result.get("decision", "UNKNOWN"),
            "bloom_student": b_result.get("bloom_tag_student", "remember"),
            "rubric_scores": scores,
            "avg_score": round(sum(scores.values()) / len(scores), 2) if scores else 0.0
        })
        
        dialogue_history.append({"role": "student", "text": student_message})
        dialogue_history.append({"role": "tutor", "text": hint, "bloom_tag": b_result.get("bloom_tag_hint")})
    
    # Aggregate statistics
    all_scores = [t["avg_score"] for t in turn_reports if "avg_score" in t]
    decisions = [t.get("decision", "") for t in turn_reports if "decision" in t]
    
    report = {
        "notebook_id": req.notebook_id,
        "topic": topic,
        "n_turns": req.n_turns,
        "turns": turn_reports,
        "summary": {
            "avg_rubric_score": round(sum(all_scores) / len(all_scores), 2) if all_scores else 0.0,
            "approval_rate": round(decisions.count("APPROVE") / len(decisions), 2) if decisions else 0.0,
            "peer_triggers": decisions.count("PEER_REQUIRED"),
            "dvs_triggers": decisions.count("DVS_REQUIRED"),
            "revision_requests": decisions.count("REQUEST_REVISION")
        }
    }
    
    return report
