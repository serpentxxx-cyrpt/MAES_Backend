from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
import uuid
from typing import List
from app.db.models import ImportUrlRequest, ImportYoutubeRequest, PasteTextRequest, ToggleSourceRequest
from app.db.supabase_client import get_supabase
from app.services.source_processor import extract_text_from_pdf, extract_text_from_url, extract_text_from_youtube
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/sources", tags=["Sources"])

def _check_notebook_owner(sb, notebook_id: str, student_id: str):
    if not sb:
        return
    res = sb.table("notebooks").select("id").eq("id", notebook_id).eq("student_id", student_id).execute()
    if not res.data:
        raise HTTPException(status_code=403, detail="Access denied to this notebook context.")

def _check_source_owner(sb, source_id: str, student_id: str):
    if not sb:
        return
    res = sb.table("sources").select("notebook_id").eq("id", source_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Source not found.")
    _check_notebook_owner(sb, res.data[0]["notebook_id"], student_id)

@router.get("/{notebook_id}")
async def get_sources(notebook_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    if sb:
        _check_notebook_owner(sb, notebook_id, user["user_id"])
        result = sb.table("sources").select("*").eq("notebook_id", notebook_id).execute()
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
async def upload_file(
    notebook_id: str = Form(...), 
    file: UploadFile = File(...), 
    user: dict = Depends(get_current_user)
):
    sb = get_supabase()
    _check_notebook_owner(sb, notebook_id, user["user_id"])
    
    text = ""
    if file.filename.endswith('.pdf'):
        text = await extract_text_from_pdf(file)
        if text.startswith("SYSTEM NOTE: The uploaded PDF could not be read"):
            raise HTTPException(status_code=400, detail="The uploaded PDF appears to be a scanned image and contains no readable text. Please upload a text-searchable PDF.")
    else:
        content = await file.read()
        text = content.decode("utf-8")
        
    from app.services.knowledge_extractor import extract_knowledge
    structured = await extract_knowledge(text)
    return _save_source(notebook_id, "pdf" if file.filename.endswith('.pdf') else "note", file.filename, text, structured)

@router.post("/import-url")
async def import_url(req: ImportUrlRequest, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    _check_notebook_owner(sb, req.notebook_id, user["user_id"])
    text = extract_text_from_url(req.url)
    from app.services.knowledge_extractor import extract_knowledge
    structured = await extract_knowledge(text)
    return _save_source(req.notebook_id, "url", req.url, text, structured)

@router.post("/import-youtube")
async def import_youtube(req: ImportYoutubeRequest, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    _check_notebook_owner(sb, req.notebook_id, user["user_id"])
    text = extract_text_from_youtube(req.url)
    from app.services.knowledge_extractor import extract_knowledge
    structured = await extract_knowledge(text)
    return _save_source(req.notebook_id, "youtube", req.url, text, structured)

@router.post("/paste")
async def paste_text(req: PasteTextRequest, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    _check_notebook_owner(sb, req.notebook_id, user["user_id"])
    from app.services.knowledge_extractor import extract_knowledge
    structured = await extract_knowledge(req.content)
    return _save_source(req.notebook_id, "paste", req.title, req.content, structured)

@router.delete("/{source_id}")
async def delete_source(source_id: str, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    if sb:
        _check_source_owner(sb, source_id, user["user_id"])
        sb.table("sources").delete().eq("id", source_id).execute()
    return {"status": "deleted"}

@router.patch("/{source_id}/toggle")
async def toggle_source(source_id: str, req: ToggleSourceRequest, user: dict = Depends(get_current_user)):
    sb = get_supabase()
    if sb:
        _check_source_owner(sb, source_id, user["user_id"])
        sb.table("sources").update({"is_active": req.is_active}).eq("id", source_id).execute()
    return {"status": "updated"}

def _save_source(notebook_id: str, type: str, title: str, text: str, structured_content: dict):
    sb = get_supabase()
    new_src = {
        "id": str(uuid.uuid4()),
        "notebook_id": notebook_id,
        "source_type": type,
        "title": title,
        "raw_content": text,
        "structured_content": structured_content,
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
    
    import datetime
    return {"source": {
        **new_src, 
        "notebookId": notebook_id, 
        "sourceType": type,
        "isActive": True,
        "createdAt": datetime.datetime.now().isoformat()
    }}

