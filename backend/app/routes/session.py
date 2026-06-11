from fastapi import APIRouter, Depends, HTTPException
from app.db.models import SessionStartRequest, SessionEndRequest
from app.db.supabase_client import create_session, get_learner_model, end_session as db_end_session
from app.db.upstash_client import set_session_context, delete_session, get_session_context
from app.middleware.auth import get_current_user
import uuid
import asyncio

router = APIRouter()

@router.post("/start")
async def start_session(req: SessionStartRequest, user: dict = Depends(get_current_user)):
    session_id = str(uuid.uuid4())
    student_id = user["user_id"]
    
    # Create session in Supabase (wrap in thread)
    await asyncio.to_thread(create_session, session_id, student_id, req.domain, req.notebook_id)
    
    # Load learner model (wrap in thread)
    learner_model = await asyncio.to_thread(get_learner_model, student_id)
    
    # Initialize cache in Upstash Redis
    await set_session_context(session_id, {
        "student_id": student_id,
        "domain": req.domain,
        "notebook_id": req.notebook_id,
        "turn_number": 1,
        "current_register": learner_model.get("preferred_style", "socratic"),
        "learner_model": learner_model,
        "history": []
    })
    
    return {"session_id": session_id}

@router.post("/end")
async def end_session(req: SessionEndRequest, user: dict = Depends(get_current_user)):
    context = await get_session_context(req.session_id)
    if context and context.get("student_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to this session.")
        
    # End in DB
    await asyncio.to_thread(db_end_session, req.session_id)
    # Clear cache
    await delete_session(req.session_id)
    return {"status": "ended"}


