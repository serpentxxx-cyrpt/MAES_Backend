# pyrefly: ignore [missing-import]
from langgraph.graph import StateGraph, END
# pyrefly: ignore [missing-import]
from app.agents.agent_a import run_agent_a
from app.agents.agent_b import run_agent_b
from typing import TypedDict, Optional
from app.db.neon_client import log_audit_entry
import asyncio

class TurnState(TypedDict):
    session_id: str
    student_id: str
    student_message: str
    learner_model: dict
    current_register: str
    turn_number: int
    dialogue_history: list
    agent_a_draft: Optional[dict]
    agent_b_result: Optional[dict]
    agent_b_signal: Optional[dict]


def route_after_audit(state: TurnState) -> str:
    decision = state.get("agent_b_result", {}).get("decision", "APPROVE")
    
    # Check if we already revised once in this turn
    if state.get("agent_b_signal", {}).get("correction"):
        print(f"[ORCHESTRATOR] Agent B decision: {decision} (Forced END due to loop limit)")
        return END

    print(f"[ORCHESTRATOR] Agent B decision: {decision}")
    return END if decision == "APPROVE" else "revise"

async def inject_correction_and_log(state: TurnState) -> TurnState:
    b = state["agent_b_result"]
    a = state["agent_a_draft"]
    
    # Fire and forget audit log to Neon
    asyncio.create_task(log_audit_entry(
        session_id=state["session_id"],
        student_id=state["student_id"],
        turn_number=state["turn_number"],
        data={
            "student_message": state["student_message"],
            "hint_delivered": a.get("hint_text") if b.get("decision") == "APPROVE" else None,
            "bloom_tag_student": b.get("bloom_tag_student"),
            "bloom_tag_hint": b.get("bloom_tag_hint"),
            "register_at_turn": state["current_register"],
            "decision": b.get("decision"),
            "correction_applied": state.get("agent_b_signal") is not None,
            "struggle_level": b.get("struggle_level"),
            "score_hint_quality": b.get("rubric_scores", {}).get("hint_quality"),
            "score_tone": b.get("rubric_scores", {}).get("tone"),
            "score_correctness": b.get("rubric_scores", {}).get("correctness"),
            "score_bloom_align": b.get("rubric_scores", {}).get("bloom_alignment"),
        }
    ))
    
    return {**state, "agent_b_signal": {
        "correction": b.get("correction_note"),
        "register_switch": b.get("register_switch"),
        "struggle_level": b.get("struggle_level")
    }}

def build_graph():
    g = StateGraph(TurnState)
    g.add_node("agent_a",         run_agent_a)
    g.add_node("agent_b",         run_agent_b)
    g.add_node("inject_signal",   inject_correction_and_log)
    g.add_node("revise",          run_agent_a)

    g.set_entry_point("agent_a")
    g.add_edge("agent_a", "agent_b")
    g.add_edge("agent_b", "inject_signal")
    g.add_conditional_edges("inject_signal", route_after_audit, {END: END, "revise": "revise"})
    g.add_edge("revise", "agent_b") # Loop back to Agent B to re-evaluate the revision
    
    return g.compile()

graph = build_graph()
