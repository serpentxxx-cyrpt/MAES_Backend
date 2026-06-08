# pyrefly: ignore [missing-import]
from openai import AsyncOpenAI
from app.config import settings
import json
from app.services.json_utils import repair_and_parse_json

AGENT_A_SYSTEM = """
You are Agent A: the AI Teacher. Your goal is to explain topics comprehensively based on the context provided, solve problems when the student is stuck, and occasionally ask questions to verify understanding. Do not be overly strict about hiding answers.
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
    if correction and correction.get("correction"):
        correction_note = f"\n\nAUDIT CORRECTION: {correction['correction']}"
    if correction and correction.get("register_switch"):
        correction_note += f"\nSWITCH REGISTER TO: {correction['register_switch']}"

    history_str = ""
    history_list = state.get("dialogue_history", [])
    if history_list:
        history_str = "\n\nDIALOGUE HISTORY:\n" + "\n".join([
            f"{'Student' if h['role'] == 'student' else 'Tutor'}: {h['text']}" for h in history_list
        ])

    payload = {
        "student_message": state["student_message"],
        "dialogue_history": state.get("dialogue_history", []),
        "learner_model": state.get("learner_model", {}),
        "current_register": state.get("current_register", "socratic")
    }

    prompt_text = f"RESPOND TO THIS STATE:\n{json.dumps(payload, indent=2)}\n\n"
    if state.get("active_sources"):
        prompt_text += f"\n--- PROVIDED DOCUMENTS/SOURCES ---\n{state['active_sources']}\n-----------------------------------\n"
        prompt_text += "\nCRITICAL: You MUST read the PROVIDED DOCUMENTS/SOURCES above to answer the user. Do NOT claim you don't have access to the document, the full text is provided right above this line."
    
    if correction_note:
        prompt_text += correction_note

    messages = [
        {"role": "system", "content": AGENT_A_SYSTEM},
        {"role": "user", "content": prompt_text}
    ]

    client = AsyncOpenAI(api_key=settings.mistral_api_key, base_url="https://api.mistral.ai/v1")
    response = await client.chat.completions.create(
        model="mistral-large-latest",
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=800
    )

    draft = repair_and_parse_json(response.choices[0].message.content)
    
    # Save the audit log
    from app.db.neon_client import log_event
    hint_text = draft.get("hint_text", "")
    await log_event(
        session_id=state.get("session_id", ""),
        student_id=state.get("student_id", ""),
        event_type="agent_a_draft",
        text=f"Tutor generated draft hint: {hint_text[:50]}...",
        status="pending"
    )
    
    return {**state, "agent_a_draft": draft}

