from fastapi import APIRouter
import uuid
from app.db.models import CreateNotebookRequest, CreateNoteRequest, UpdateNoteRequest
from app.db.supabase_client import get_supabase

router = APIRouter(prefix="/notebooks", tags=["Notebooks"])

@router.get("")
async def list_notebooks():
    sb = get_supabase()
    if sb:
        res = sb.table("notebooks").select("id, title, domain, created_at, updated_at").order('updated_at', desc=True).execute()
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
    return {"notebooks": []}

@router.post("")
async def create_notebook(req: CreateNotebookRequest):
    sb = get_supabase()
    user_id = "student_123"
    nb = {
        "id": str(uuid.uuid4()),
        "title": req.title,
        "domain": req.domain,
        "student_id": user_id
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
    import datetime
    return {"notebook": {**nb, "createdAt": datetime.datetime.now().isoformat(), "updatedAt": datetime.datetime.now().isoformat()}}

@router.get("/{id}")
async def get_notebook(id: str):
    sb = get_supabase()
    if sb:
        res = sb.table("notebooks").select("*").eq("id", id).execute()
        if res.data:
            return {"notebook": res.data[0]}
    return {"notebook": {"id": id, "title": "Mock Notebook", "domain": "General"}}

@router.get("/{id}/notes")
async def get_notes(id: str):
    sb = get_supabase()
    if sb:
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
async def create_note(id: str, req: CreateNoteRequest):
    sb = get_supabase()
    note = {
        "id": str(uuid.uuid4()),
        "notebook_id": id,
        "title": req.title,
        "content": req.content
    }
    if sb:
        res = sb.table("notes").insert(note).execute()
        row = res.data[0]
        return {"note": {
            "id": row["id"],
            "title": row["title"],
            "content": row["content"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"]
        }}
    return {"note": note}

@router.patch("/{id}/notes/{note_id}")
async def update_note(id: str, note_id: str, req: UpdateNoteRequest):
    sb = get_supabase()
    if sb:
        sb.table("notes").update({"content": req.content}).eq("id", note_id).execute()
    return {"status": "updated"}

@router.get("/{id}/decks")
async def get_decks(id: str):
    return {"decks": []} # Simplified for prototype
