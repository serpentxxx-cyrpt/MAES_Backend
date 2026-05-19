from fastapi import APIRouter, Depends, HTTPException
import uuid
from app.db.models import StartSessionRequest, EndSessionRequest
from app.db.supabase_client import get_supabase
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/session", tags=["Session"])

@router.post("/start")
async def start_session(req: StartSessionRequest):
    # Dummy user for local dev prototype
    user_id = "student_123" 
    session_id = str(uuid.uuid4())
    
    sb = get_supabase()
    if sb:
        sb.table("sessions").insert({
            "id": session_id,
            "notebook_id": req.notebook_id,
            "student_id": user_id,
            "domain": req.domain,
            "is_active": True
        }).execute()
        
    return {"session_id": session_id, "status": "active"}

@router.post("/end")
async def end_session(req: EndSessionRequest):
    sb = get_supabase()
    if sb:
        sb.table("sessions").update({"is_active": False}).eq("id", req.session_id).execute()
    return {"status": "ended"}
