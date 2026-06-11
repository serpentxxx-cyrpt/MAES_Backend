from supabase import create_client, Client
from app.config import settings

supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key
)

def get_supabase() -> Client:
    """Returns the primary Supabase client."""
    return supabase

def get_learner_model(student_id: str) -> dict:
    try:
        response = supabase.table("learner_models").select("*").eq("student_id", student_id).execute()
        if response.data:
            return response.data[0]
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Learner models table missing or error: {e}")
    return {}

def update_learner_model(student_id: str, updates: dict):
    try:
        supabase.table("learner_models").upsert({"student_id": student_id, **updates}).execute()
    except Exception as e:
        pass

def create_session(session_id: str, student_id: str, domain: str, notebook_id: str = None):
    data = {
        "id": session_id,
        "student_id": student_id,
        "domain": domain,
        "is_active": True
    }
    if notebook_id:
        data["notebook_id"] = notebook_id
    try:
        supabase.table("sessions").insert(data).execute()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to create session in Supabase: {e}")

def end_session(session_id: str):
    # Just update the ended_at timestamp and set is_active = False
    import datetime
    try:
        supabase.table("sessions").update({
            "is_active": False,
            "ended_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }).eq("id", session_id).execute()
    except Exception:
        pass

def save_message(session_id: str, role: str, content: str):
    """Saves a dialogue message turn directly into the Supabase database messages table."""
    try:
        supabase.table("messages").insert({
            "session_id": session_id,
            "role": role,
            "content": content
        }).execute()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to log message to Supabase: {e}")

def save_audit_log(session_id: str, event_type: str, text: str, status: str):
    """Saves a telemetry audit log for the session."""
    try:
        supabase.table("audit_logs").insert({
            "session_id": session_id,
            "event_type": event_type,
            "text": text,
            "status": status
        }).execute()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to log audit event to Supabase: {e}")

def get_session_messages(session_id: str) -> list:
    """Retrieves all dialogue turns for a specific session."""
    try:
        res = supabase.table("messages").select("*").eq("session_id", session_id).order("created_at").execute()
        return res.data or []
    except Exception:
        return []

def get_student_history(student_id: str) -> list:
    """Retrieves all dialogue turns across all sessions for a specific student for long-term memory."""
    try:
        # Get all sessions for this student
        sess_res = supabase.table("sessions").select("id").eq("student_id", student_id).execute()
        sess_ids = [s["id"] for s in sess_res.data] if sess_res.data else []
        if not sess_ids:
            return []
        
        # Fetch all messages for these sessions
        msg_res = supabase.table("messages").select("*").in_("session_id", sess_ids).order("created_at").execute()
        return msg_res.data or []
    except Exception:
        return []


