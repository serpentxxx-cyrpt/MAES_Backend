from fastapi import APIRouter, HTTPException, Depends
from app.db.models import TurnRequest
from app.db.upstash_client import get_session_context, set_session_context
from app.db.supabase_client import save_message, get_supabase
from app.agents.orchestrator import graph
from app.middleware.auth import get_current_user

router = APIRouter()

@router.post("/")
async def process_turn(req: TurnRequest, user: dict = Depends(get_current_user)):
    context = await get_session_context(req.session_id)
    if not context:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
        
    if context.get("student_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to this session.")

    history = context.get("history", [])

    
    initial_state = {
        "session_id": req.session_id,
        "student_id": context.get("student_id"),
        "student_message": req.student_message,
        "learner_model": context.get("learner_model", {}),
        "current_register": context.get("current_register", "socratic"),
        "turn_number": context.get("turn_number", 1),
        "dialogue_history": history,
        "agent_a_draft": None,
        "agent_b_result": None,
        "agent_b_signal": None,
    }
    
    # Retrieve active sources from notebook context
    notebook_id = context.get("notebook_id")
    import logging
    logging.warning(f"Turn started! Session ID: {req.session_id}, Notebook ID in context: {notebook_id}")
    if notebook_id:
        sb = get_supabase()
        if sb:
            res = sb.table("sources").select("title, structured_content, raw_content").eq("notebook_id", notebook_id).eq("is_active", True).execute()
            logging.warning(f"Fetched {len(res.data) if res.data else 0} sources for notebook {notebook_id}")
            if res.data:
                import json
                sources_blocks = []
                for row in res.data:
                    structured = row.get("structured_content")
                    raw = row.get("raw_content", "")
                    block = f"--- SOURCE: {row['title']} ---\n"
                    if structured:
                        block += f"[STRUCTURED SUMMARY]\n{json.dumps(structured, indent=2)}\n\n"
                    block += f"[RAW TEXT]\n{raw}\n"
                    sources_blocks.append(block)
                
                sources_text = "\n\n".join(sources_blocks)
                initial_state["active_sources"] = sources_text[:100000] # Cap context window much higher for full text
                logging.warning(f"Active sources text length: {len(initial_state['active_sources'])}")
    
    # Save the student's message in Supabase
    save_message(req.session_id, "student", req.student_message)
    
    try:
        final_state = await graph.ainvoke(initial_state)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Graph execution failed (possibly recursion limit): {e}")
        # fallback state
        final_state = initial_state
        if not final_state.get("agent_a_draft"):
            final_state["agent_a_draft"] = {"hint_text": "I'm experiencing a pedagogical loop. Can you rephrase?"}
        if not final_state.get("agent_b_result"):
            final_state["agent_b_result"] = {"bloom_tag_student": "remember", "register_switch": "socratic"}
    
    hint = (final_state.get("agent_a_draft") or {}).get("hint_text", "I'm not sure how to respond.")
    bloom = (final_state.get("agent_b_result") or {}).get("bloom_tag_student", "remember")
    
    # Save the tutor's final hint in Supabase
    save_message(req.session_id, "tutor", hint)
    
    # Update dialogue history in context
    history.append({"role": "student", "text": req.student_message})
    history.append({"role": "tutor", "text": hint, "bloom_tag": bloom})
    context["history"] = history
    
    # Update cache
    new_register = (final_state.get("agent_b_result") or {}).get("register_switch") or context.get("current_register", "socratic")
    context["turn_number"] += 1
    context["current_register"] = new_register
    await set_session_context(req.session_id, context)
    
    return {
        "hint_text": hint,
        "bloom_tag": bloom,
        "register": new_register
    }


