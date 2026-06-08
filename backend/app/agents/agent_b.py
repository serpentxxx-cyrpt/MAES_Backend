import json
# pyrefly: ignore [missing-import]
from openai import AsyncOpenAI
from app.config import settings
from app.services.json_utils import repair_and_parse_json


AGENT_B_SYSTEM = """
You are Agent B: the Pedagogical Auditor. Evaluate the teacher's draft response. Ensure the teacher explains concepts well based on context, helps solve problems, and occasionally asks questions. Do not penalize the tutor for revealing answers or explaining concepts directly.
Return ONLY a valid JSON object with this exact structure:
{
  "decision": "APPROVE|REQUEST_REVISION|SWITCH_REGISTER",
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
Approve if avg score >= 3.5 AND correctness >= 4. Otherwise REQUEST_REVISION.
"""

async def run_agent_b(state: dict) -> dict:
    payload = {
        "student_message": state["student_message"],
        "agent_a_draft": state["agent_a_draft"],
        "dialogue_history": state.get("dialogue_history", []),
        "learner_model": state.get("learner_model", {}),
        "current_register": state.get("current_register", "socratic"),
        "turn_number": state.get("turn_number", 1),
        "active_sources": state.get("active_sources", "")
    }

    messages = [
        {"role": "system", "content": AGENT_B_SYSTEM},
        {"role": "user", "content": "EVALUATE THIS:\n" + json.dumps(payload)}
    ]

    client = AsyncOpenAI(api_key=settings.mistral_api_key, base_url="https://api.mistral.ai/v1")
    response = await client.chat.completions.create(
        model="mistral-large-latest",
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.1,
        max_tokens=600
    )

    result = repair_and_parse_json(response.choices[0].message.content)
    return {**state, "agent_b_result": result}

