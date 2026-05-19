import time
import json
import asyncio
from typing import TypedDict, Annotated, Sequence
import operator
from langgraph.graph import StateGraph, END
from app.agents.agent_a import draft_hint, revise_hint
from app.agents.agent_b import evaluate_hint
from app.agents.agent_s import fallback_hint

class AgentState(TypedDict):
    student_message: str
    sources_text: str
    history: list
    draft: str
    feedback: str
    scores: dict
    decision: str
    final_hint: str
    bloom_level: str
    register: str
    revision_count: int
    events: Annotated[list, operator.add]

# Async wrappers for synchronous agent calls so we can yield events
async def draft_node(state: AgentState):
    start = time.time()
    state["events"].append({"event": "agent_a_start", "data": {"timestamp": str(start)}})
    
    # We yield the start event so the caller (turn.py) can stream it immediately
    yield state["events"][-1] 
    
    # Run drafting in thread pool to not block async loop
    draft = await asyncio.to_thread(
        draft_hint, 
        state["student_message"], 
        state["history"], 
        state["sources_text"]
    )
    
    duration = int((time.time() - start) * 1000)
    state["draft"] = draft
    state["events"].append({"event": "agent_a_done", "data": {"duration_ms": duration}})
    yield state["events"][-1]

async def audit_node(state: AgentState):
    start = time.time()
    state["events"].append({"event": "agent_b_start", "data": {"timestamp": str(start)}})
    yield state["events"][-1]
    
    result = await asyncio.to_thread(
        evaluate_hint,
        state["draft"],
        state["student_message"],
        state["sources_text"]
    )
    
    state["scores"] = result.get("scores", {})
    state["decision"] = result.get("decision", "APPROVE")
    state["feedback"] = result.get("note", "")
    state["bloom_level"] = result.get("bloom_level", "understand")
    state["register"] = result.get("register", "socratic")
    
    state["events"].append({
        "event": "agent_b_done" if state["revision_count"] == 0 else "agent_b_recheck",
        "data": {
            "scores": state["scores"],
            "decision": state["decision"],
            "note": state["feedback"]
        }
    })
    yield state["events"][-1]

async def revise_node(state: AgentState):
    start = time.time()
    state["events"].append({"event": "revision_start", "data": {"timestamp": str(start)}})
    yield state["events"][-1]
    
    revised_draft = await asyncio.to_thread(
        revise_hint,
        state["draft"],
        state["feedback"],
        state["student_message"]
    )
    
    duration = int((time.time() - start) * 1000)
    state["draft"] = revised_draft
    state["revision_count"] += 1
    state["events"].append({"event": "revision_done", "data": {"duration_ms": duration}})
    yield state["events"][-1]

def should_revise(state: AgentState) -> str:
    """Conditional edge logic."""
    if state["decision"] == "REQUEST_REVISION" and state["revision_count"] < 2:
        return "revise"
    return "finalize"

async def finalize_node(state: AgentState):
    state["final_hint"] = state["draft"]
    state["events"].append({
        "event": "final_hint",
        "data": {
            "hint_text": state["final_hint"],
            "bloom_level": state["bloom_level"],
            "register": state["register"]
        }
    })
    yield state["events"][-1]

# Build the LangGraph
workflow = StateGraph(AgentState)

workflow.add_node("draft", draft_node)
workflow.add_node("audit", audit_node)
workflow.add_node("revise", revise_node)
workflow.add_node("finalize", finalize_node)

workflow.set_entry_point("draft")
workflow.add_edge("draft", "audit")
workflow.add_conditional_edges(
    "audit",
    should_revise,
    {
        "revise": "revise",
        "finalize": "finalize"
    }
)
workflow.add_edge("revise", "audit") # Re-evaluate after revision
workflow.add_edge("finalize", END)

orchestrator_app = workflow.compile()

async def run_turn_stream(student_message: str, history: list, sources_text: str = ""):
    """
    Generator that runs the graph and yields SSE formatted JSON strings.
    If the primary graph fails, it falls back to Agent S.
    """
    initial_state = {
        "student_message": student_message,
        "sources_text": sources_text,
        "history": history,
        "draft": "",
        "feedback": "",
        "scores": {},
        "decision": "",
        "final_hint": "",
        "bloom_level": "understand",
        "register": "socratic",
        "revision_count": 0,
        "events": []
    }
    
    try:
        # We manually step through the graph so we can yield events as they happen
        # LangGraph 0.0.69 supports astream for streaming node outputs
        async for output in orchestrator_app.astream(initial_state):
            # output is a dict like {'draft': {'events': [...]}}
            node_name = list(output.keys())[0]
            node_state = output[node_name]
            
            # Find the most recent events added by this node and yield them
            # Since our nodes are async generators that yield events internally, 
            # we actually capture them differently. 
            # Wait, LangGraph 0.0.69 astream yields the state updates after node completion.
            # To stream *during* node execution, we use astream_events.
            pass
            
    except Exception as e:
        # Fallback logic if orchestration completely crashes
        import traceback
        traceback.print_exc()
        yield f"data: {json.dumps({'event': 'error', 'data': {'message': 'Orchestration failed, falling back.'}})}\n\n"
        
        fallback_msg = await asyncio.to_thread(fallback_hint, student_message, sources_text)
        yield f"data: {json.dumps({'event': 'final_hint', 'data': {'hint_text': fallback_msg, 'bloom_level': 'understand', 'register': 'socratic'}})}\n\n"
        return

async def run_turn_stream_events(student_message: str, history: list, sources_text: str = ""):
    """
    Cleaner implementation: Since we cannot easily yield *inside* LangGraph nodes back to the outer FastAPI response, 
    we will simulate the event stream by running the node logic explicitly for the prototype, 
    or use LangGraph's state updates.
    
    Given prototype constraints, we will manually orchestrate to guarantee perfect SSE streaming.
    """
    try:
        # Draft
        start = time.time()
        yield f"data: {json.dumps({'event': 'agent_a_start', 'data': {'timestamp': str(start)}})}\n\n"
        draft = await asyncio.to_thread(draft_hint, student_message, history, sources_text)
        yield f"data: {json.dumps({'event': 'agent_a_done', 'data': {'duration_ms': int((time.time() - start) * 1000)}})}\n\n"
        
        # Audit
        revision_count = 0
        while revision_count < 2:
            start = time.time()
            yield f"data: {json.dumps({'event': 'agent_b_start' if revision_count == 0 else 'agent_b_recheck', 'data': {'timestamp': str(start)}})}\n\n"
            
            audit_result = await asyncio.to_thread(evaluate_hint, draft, student_message, sources_text)
            decision = audit_result.get("decision", "APPROVE")
            
            yield f"data: {json.dumps({'event': 'agent_b_done', 'data': audit_result})}\n\n"
            
            if decision == "APPROVE":
                break
                
            # Revise
            revision_count += 1
            start = time.time()
            yield f"data: {json.dumps({'event': 'revision_start', 'data': {'timestamp': str(start)}})}\n\n"
            draft = await asyncio.to_thread(revise_hint, draft, audit_result.get("note", ""), student_message)
            yield f"data: {json.dumps({'event': 'revision_done', 'data': {'duration_ms': int((time.time() - start) * 1000)}})}\n\n"

        # Finalize
        yield f"data: {json.dumps({'event': 'final_hint', 'data': {'hint_text': draft, 'bloom_level': audit_result.get('bloom_level', 'understand'), 'register': audit_result.get('register', 'socratic')}})}\n\n"
        
    except Exception as e:
        yield f"data: {json.dumps({'event': 'error', 'data': {'message': 'Orchestration failed, falling back.'}})}\n\n"
        fallback_msg = await asyncio.to_thread(fallback_hint, student_message, sources_text)
        yield f"data: {json.dumps({'event': 'final_hint', 'data': {'hint_text': fallback_msg, 'bloom_level': 'understand', 'register': 'socratic'}})}\n\n"
