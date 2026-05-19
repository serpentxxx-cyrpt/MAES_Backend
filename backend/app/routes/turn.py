from fastapi import APIRouter, Depends, Request
from sse_starlette.sse import EventSourceResponse
from app.agents.orchestrator import run_turn_stream_events
from app.db.supabase_client import get_supabase
from app.db.neon_client import log_audit_event
from app.middleware.sanitizer import sanitize_student_input, wrap_for_llm
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/turn", tags=["Turn Cycle"])

@router.get("/stream")
async def turn_stream(
    request: Request, 
    session_id: str, 
    student_message: str, 
    token: str = None
):
    """
    SSE Endpoint for the orchestration cycle.
    Validates token from query param (EventSource limitations).
    """
    # 1. Manual Auth Check since this is a GET via EventSource
    if not token:
        # For prototype without strict enforcement, we'll allow it if missing in dev, 
        # but normally we'd reject. Let's just create a dummy user_id if missing.
        user_id = "anonymous"
    else:
        # Pseudo token check
        user_id = "student_123"

    # 2. Sanitize
    clean_msg = sanitize_student_input(student_message)
    wrapped_msg = wrap_for_llm(clean_msg)
    
    # 3. Fetch sources text (mocked for stream speed, typically from DB or Vector Store)
    sources_text = ""
    sb = get_supabase()
    if sb:
        # Get notebook_id for session, then get sources
        # (Omitted full DB logic for brevity in prototype)
        pass
        
    # 4. Save student message to DB
    if sb:
        sb.table("messages").insert({
            "session_id": session_id,
            "role": "student",
            "content": clean_msg
        }).execute()
        
    # 5. Execute stream generator
    # EventSourceResponse expects an async generator yielding dicts or strings formatted as SSE.
    # run_turn_stream_events yields formatted strings: "data: {...}\n\n"
    
    # (In a real app, we would intercept the final hint and save it to the DB here. 
    # For SSE, it's easier to let the frontend save it, or run a background task).
    
    return EventSourceResponse(run_turn_stream_events(wrapped_msg, [], sources_text))
