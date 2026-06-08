from fastapi import APIRouter
import uuid
import datetime
from app.db.models import GenerateFlashcardsRequest, GenerateQuizRequest, GenerateStudyGuideRequest
from app.db.supabase_client import get_supabase, get_learner_model, get_student_history
from app.services.flashcard_gen import generate_flashcards
from app.services.quiz_gen import generate_quiz

router = APIRouter(prefix="/studio", tags=["Studio Generations"])

def _get_notebook_context(notebook_id: str) -> str:
    """Concatenates all active sources for a notebook to use as LLM context."""
    sb = get_supabase()
    if not sb:
        return ""
    res = sb.table("sources").select("raw_content").eq("notebook_id", notebook_id).eq("is_active", True).execute()
    context = "\n\n".join([row["raw_content"] for row in res.data if row["raw_content"]])
    return context

@router.post("/flashcards")
async def create_flashcards(req: GenerateFlashcardsRequest):
    context = _get_notebook_context(req.notebook_id)
    
    # Retrieve student id scoping
    sb = get_supabase()
    student_id = "123e4567-e89b-12d3-a456-426614174000"
    if sb:
        res = sb.table("notebooks").select("student_id").eq("id", req.notebook_id).execute()
        if res.data:
            student_id = res.data[0].get("student_id") or "123e4567-e89b-12d3-a456-426614174000"
            
    history = get_student_history(student_id)
    cards_data = await generate_flashcards(context, req.topic, history)
    
    deck = {
        "id": str(uuid.uuid4()),
        "notebookId": req.notebook_id,
        "title": req.topic if req.topic else "Generated Flashcards",
        "createdAt": datetime.datetime.now().isoformat(),
        "cards": []
    }
    
    for i, c in enumerate(cards_data):
        deck["cards"].append({
            "id": str(uuid.uuid4()),
            "deckId": deck["id"],
            "front": c.get("front", ""),
            "back": c.get("back", ""),
            "status": "unseen",
            "sortOrder": i
        })
        
    return {"deck": deck}

@router.post("/quiz")
async def create_quiz(req: GenerateQuizRequest):
    context = _get_notebook_context(req.notebook_id)
    
    # Retrieve student id scoping
    sb = get_supabase()
    student_id = "123e4567-e89b-12d3-a456-426614174000"
    if sb:
        res = sb.table("notebooks").select("student_id").eq("id", req.notebook_id).execute()
        if res.data:
            student_id = res.data[0].get("student_id") or "123e4567-e89b-12d3-a456-426614174000"
            
    # Load profile data from Supabase
    learner_model = get_learner_model(student_id)
    history = get_student_history(student_id)
    
    # Generate quiz personalized for the student's cognitive records and discussed themes
    quiz_data = await generate_quiz(context, req.num_questions, req.difficulty, learner_model, history)
    
    questions = []
    for q in quiz_data:
        questions.append({
            "id": str(uuid.uuid4()),
            "question": q.get("question", ""),
            "options": q.get("options", []),
            "correct_index": q.get("correct_index", 0),
            "explanation": q.get("explanation", ""),
            "bloom_level": q.get("bloom_level", "understand")
        })
        
    return {"quiz": {"id": str(uuid.uuid4()), "questions": questions}}


@router.post("/study-guide")
async def create_study_guide(req: GenerateStudyGuideRequest):
    from fastapi import HTTPException
    raise HTTPException(status_code=501, detail="Study guide generation with LLM is not implemented yet.")
