from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import uuid
from typing import List
from app.db.models import ImportUrlRequest, ImportYoutubeRequest, PasteTextRequest, ToggleSourceRequest
from app.db.supabase_client import get_supabase
from app.services.source_processor import extract_text_from_pdf, extract_text_from_url, extract_text_from_youtube

router = APIRouter(prefix="/sources", tags=["Sources"])

@router.get("/{notebook_id}")
async def get_sources(notebook_id: str):
    sb = get_supabase()
    if sb:
        result = sb.table("sources").select("*").eq("notebook_id", notebook_id).execute()
        # Ensure mapping to camelCase for frontend (createdAt, isActive, sourceType)
        sources = []
        for row in result.data:
            sources.append({
                "id": row["id"],
                "notebookId": row["notebook_id"],
                "sourceType": row["source_type"],
                "title": row["title"],
                "isActive": row["is_active"],
                "createdAt": row["created_at"]
            })
        return {"sources": sources}
    return {"sources": []}

@router.post("/upload")
async def upload_file(notebook_id: str = Form(...), file: UploadFile = File(...)):
    text = ""
    if file.filename.endswith('.pdf'):
        text = await extract_text_from_pdf(file)
    else:
        content = await file.read()
        text = content.decode("utf-8")
        
    return _save_source(notebook_id, "pdf" if file.filename.endswith('.pdf') else "note", file.filename, text)

@router.post("/import-url")
async def import_url(req: ImportUrlRequest):
    text = extract_text_from_url(req.url)
    return _save_source(req.notebook_id, "url", req.url, text)

@router.post("/import-youtube")
async def import_youtube(req: ImportYoutubeRequest):
    text = extract_text_from_youtube(req.url)
    return _save_source(req.notebook_id, "youtube", req.url, text)

@router.post("/paste")
async def paste_text(req: PasteTextRequest):
    return _save_source(req.notebook_id, "paste", req.title, req.content)

@router.delete("/{source_id}")
async def delete_source(source_id: str):
    sb = get_supabase()
    if sb:
        sb.table("sources").delete().eq("id", source_id).execute()
    return {"status": "deleted"}

@router.patch("/{source_id}/toggle")
async def toggle_source(source_id: str, req: ToggleSourceRequest):
    sb = get_supabase()
    if sb:
        sb.table("sources").update({"is_active": req.is_active}).eq("id", source_id).execute()
    return {"status": "updated"}

def _save_source(notebook_id: str, type: str, title: str, text: str):
    sb = get_supabase()
    new_src = {
        "id": str(uuid.uuid4()),
        "notebook_id": notebook_id,
        "source_type": type,
        "title": title,
        "raw_content": text,
        "is_active": True
    }
    if sb:
        res = sb.table("sources").insert(new_src).execute()
        row = res.data[0]
        return {"source": {
            "id": row["id"],
            "notebookId": row["notebook_id"],
            "sourceType": row["source_type"],
            "title": row["title"],
            "isActive": row["is_active"],
            "createdAt": row["created_at"]
        }}
    
    # Mock return if DB not connected
    import datetime
    return {"source": {
        **new_src, 
        "notebookId": notebook_id, 
        "sourceType": type,
        "isActive": True,
        "createdAt": datetime.datetime.now().isoformat()
    }}
