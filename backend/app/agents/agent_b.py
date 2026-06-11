import json
from openai import AsyncOpenAI
from app.config import settings
from app.services.json_utils import repair_and_parse_json


AGENT_B_SYSTEM = """
You are Agent B: the Pedagogical Auditor. Evaluate the teacher's draft response. Ensure the teacher explains concepts well based on context, helps solve problems, and occasionally asks questions. Do not penalize the tutor for revealing answers or explaining concepts directly.

DECISION RULES:
- If the student's chronometric_load_score > 0.7 (cognitively overloaded), set decision = "DVS_REQUIRED".
- If the student's bloom_stall_count >= 3 (stuck at same Bloom level for 3+ turns), set decision = "PEER_REQUIRED".
- If avg rubric score >= 3.5 AND correctness >= 4 and no DVS/PEER trigger: set decision = "APPROVE".
- Otherwise: set decision = "REQUEST_REVISION".

Return ONLY a valid JSON object with this exact structure:
{
  "decision": "APPROVE|REQUEST_REVISION|PEER_REQUIRED|DVS_REQUIRED",
  "correction_note": "...",
  "register_switch": null,
  "struggle_level": "productive|stalled|null",
  "bloom_tag_student": "remember|understand|apply|analyze|evaluate|create",
  "bloom_tag_hint": "remember|understand|apply|analyze|evaluate|create",
  "rubric_scores": {
    "hint_quality": 4,
    "tone": 5,
    "correctness": 5,
    "bloom_alignment": 4
  }
}
"""

async def run_agent_b(state: dict) -> dict:
    payload = {
        "student_message": state["student_message"],
        "agent_a_draft": state["agent_a_draft"],
        "dialogue_history": state.get("dialogue_history", []),
        "learner_model": state.get("learner_model", {}),
        "current_register": state.get("current_register", "socratic"),
        "turn_number": state.get("turn_number", 1),
        "active_sources": state.get("active_sources", ""),
        # Phase 3: CAG inputs
        "chronometric_load_score": state.get("chronometric_load_score", 0.0),
        "bloom_stall_count": state.get("bloom_stall_count", 0),
        "active_misconception": state.get("active_misconception", None)
    }

    messages = [
        {"role": "system", "content": AGENT_B_SYSTEM},
        {"role": "user", "content": "EVALUATE THIS:\n" + json.dumps(payload)}
    ]

    client = AsyncOpenAI(api_key=settings.mistral_api_key, base_url="https://api.mistral.ai/v1")
    response = await client.chat.completions.create(
        model=settings.agent_b_model,
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.1,
        max_tokens=600
    )

    result = repair_and_parse_json(response.choices[0].message.content)

    from app.db.neon_client import log_event
    decision = result.get("decision", "APPROVE")
    
    if decision == "PEER_REQUIRED":
        log_text = "Agent B: Evaluated draft. Detected cognitive struggle (Bloom stall). Routing to Peer Agent."
    elif decision == "DVS_REQUIRED":
        log_text = "Agent B: Evaluated draft. Detected high cognitive load. Routing to DVS Generator."
    elif decision == "REQUEST_REVISION":
        log_text = "Agent B: Evaluated draft. Did not meet rubric standards. Requesting revision."
    else:
        log_text = "Agent B: Evaluated and approved draft response."

    await log_event(
        session_id=state.get("session_id", ""),
        student_id=state.get("student_id", ""),
        event_type="agent_b",
        text=log_text,
        status="agent"
    )

    return {**state, "agent_b_result": result}
