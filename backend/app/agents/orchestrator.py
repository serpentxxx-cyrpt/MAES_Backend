# pyrefly: ignore [missing-import]
from langgraph.graph import StateGraph, END
from app.agents.agent_a import run_agent_a
from app.agents.agent_b import run_agent_b
from app.agents.agent_p import run_agent_p
from app.agents.dvs_generator import run_dvs_generator
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
    # Phase 2 architecture updates
    loop_count: int
    chronometric_load_score: float
    bloom_stall_count: int
    active_misconception: Optional[str]
    audit_logs_to_dispatch: list[dict]
    # Phase 3 additions
    dvs_payload: Optional[str]
    peer_challenge: bool
    active_sources: Optional[str]


def route_after_audit(state: TurnState) -> str:
    decision = state.get("agent_b_result", {}).get("decision", "APPROVE")
    
    # Allow up to 3 revisions
    loop_count = state.get("loop_count", 0)
    if loop_count >= 3:
        print(f"[ORCHESTRATOR] Agent B decision: {decision} (Forced END — 3-loop limit)")
        return END

    print(f"[ORCHESTRATOR] Agent B decision: {decision}")
    
    if decision == "APPROVE":
        return END
    elif decision == "PEER_REQUIRED":
        return "peer_agent"
    elif decision == "DVS_REQUIRED":
        return "dvs_generator"
    else:
        return "revise"

async def inject_correction_and_log(state: TurnState) -> TurnState:
    b = state["agent_b_result"]
    a = state["agent_a_draft"]
    
    # Append log entry to state instead of firing an uncontrolled task
    logs = state.get("audit_logs_to_dispatch", [])
    logs.append({
        "session_id": state["session_id"],
        "student_id": state["student_id"],
        "turn_number": state["turn_number"],
        "data": {
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
            "peer_challenge": state.get("peer_challenge", False),
            "dvs_triggered": state.get("dvs_payload") is not None,
            "chronometric_load_score": state.get("chronometric_load_score", 0.0),
        }
    })
    
    return {
        **state, 
        "agent_b_signal": {
            "correction": b.get("correction_note"),
            "register_switch": b.get("register_switch"),
            "struggle_level": b.get("struggle_level")
        },
        "loop_count": state.get("loop_count", 0) + 1,
        "audit_logs_to_dispatch": logs
    }

def build_graph():
    g = StateGraph(TurnState)
    g.add_node("agent_a",         run_agent_a)
    g.add_node("agent_b",         run_agent_b)
    g.add_node("inject_signal",   inject_correction_and_log)
    g.add_node("revise",          run_agent_a)
    g.add_node("peer_agent",      run_agent_p)
    g.add_node("dvs_generator",   run_dvs_generator)

    g.set_entry_point("agent_a")
    g.add_edge("agent_a", "agent_b")
    g.add_edge("agent_b", "inject_signal")
    
    g.add_conditional_edges("inject_signal", route_after_audit, {
        END: END, 
        "revise": "revise",
        "peer_agent": "peer_agent",
        "dvs_generator": "dvs_generator"
    })
    
    # Agent P → Agent B (B audits P's challenge before delivery)
    g.add_edge("revise", "agent_b")
    g.add_edge("peer_agent", "agent_b")
    g.add_edge("dvs_generator", END)
    
    return g.compile()

graph = build_graph()
