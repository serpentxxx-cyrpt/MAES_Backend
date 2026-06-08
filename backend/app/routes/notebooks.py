from fastapi import APIRouter, Depends, HTTPException
import uuid
from app.db.models import CreateNotebookRequest, CreateNoteRequest, UpdateNoteRequest
from app.db.supabase_client import get_supabase
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/notebooks", tags=["Notebooks"])

@router.get("")
async def list_notebooks(user: dict = Depends(get_current_user)):
    sb = get_supabase()
    if sb:
        res = sb.table("notebooks").select("id, title, domain, created_at, updated_at")\
            .eq("student_id", user["user_id"])\
            .order('updated_at', desc=True).execute()
        nbs = []
        for row in res.data:
            nbs.append({
                "id": row["id"],
                "title": row["title"],
                "domain": row.get("domain"),
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
                "sourceCount": 0
            })
        return {"notebooks": nbs}
    raise HTTPException(status_code=500, detail="Database connection failed.")

@router.post("")
async def create_notebook(req: CreateNotebookRequest, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    nb = {
        "id": str(uuid.uuid4()),
        "title": req.title,
        "domain": req.domain,
        "student_id": user["user_id"]
    }
    if sb:
        res = sb.table("notebooks").insert(nb).execute()
        row = res.data[0]
        return {"notebook": {
            "id": row["id"],
            "title": row["title"],
            "domain": row.get("domain"),
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"]
        }}
    raise HTTPException(status_code=500, detail="Database connection failed.")

@router.get("/{id}")
async def get_notebook(id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    if sb:
        res = sb.table("notebooks").select("*").eq("id", id).eq("student_id", user["user_id"]).execute()
        if res.data:
            return {"notebook": res.data[0]}
        raise HTTPException(status_code=404, detail="Notebook not found or access denied.")
    raise HTTPException(status_code=500, detail="Database connection failed.")

@router.get("/{id}/notes")
async def get_notes(id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    if sb:
        # Check ownership first
        nb_check = sb.table("notebooks").select("id").eq("id", id).eq("student_id", user["user_id"]).execute()
        if not nb_check.data:
            raise HTTPException(status_code=403, detail="Access denied to this notebook.")
            
        res = sb.table("notes").select("*").eq("notebook_id", id).order('updated_at', desc=True).execute()
        notes = []
        for row in res.data:
            notes.append({
                "id": row["id"],
                "title": row["title"],
                "content": row["content"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"]
            })
        return {"notes": notes}
    return {"notes": []}

@router.post("/{id}/notes")
async def create_note(id: str, req: CreateNoteRequest, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    # Check ownership
    if sb:
        nb_check = sb.table("notebooks").select("id").eq("id", id).eq("student_id", user["user_id"]).execute()
        if not nb_check.data:
            raise HTTPException(status_code=403, detail="Access denied to this notebook.")
            
        note = {
            "id": str(uuid.uuid4()),
            "notebook_id": id,
            "title": req.title,
            "content": req.content
        }
        res = sb.table("notes").insert(note).execute()
        row = res.data[0]
        return {"note": {
            "id": row["id"],
            "title": row["title"],
            "content": row["content"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"]
        }}
    return {"note": {}}

@router.patch("/{id}/notes/{note_id}")
async def update_note(id: str, note_id: str, req: UpdateNoteRequest, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    if sb:
        # Check ownership
        nb_check = sb.table("notebooks").select("id").eq("id", id).eq("student_id", user["user_id"]).execute()
        if not nb_check.data:
            raise HTTPException(status_code=403, detail="Access denied to this notebook.")
            
        sb.table("notes").update({"content": req.content}).eq("id", note_id).execute()
    return {"status": "updated"}

@router.get("/{id}/decks")
async def get_decks(id: str, user: dict = Depends(get_current_user)):
    return {"decks": []}

