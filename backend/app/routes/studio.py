from fastapi import APIRouter
import uuid
import datetime
from app.db.models import GenerateFlashcardsRequest, GenerateQuizRequest, GenerateStudyGuideRequest
from app.db.supabase_client import get_supabase
from app.services.flashcard_gen import generate_flashcards
from app.services.quiz_gen import generate_quiz

router = APIRouter(prefix="/studio", tags=["Studio Generations"])

def _get_notebook_context(notebook_id: str) -> str:
    """Concatenates all active sources for a notebook to use as LLM context."""
    sb = get_supabase()
    if not sb:
        return "Mock context for testing."
        
    res = sb.table("sources").select("raw_content").eq("notebook_id", notebook_id).eq("is_active", True).execute()
    context = "\n\n".join([row["raw_content"] for row in res.data if row["raw_content"]])
    return context

@router.post("/flashcards")
async def create_flashcards(req: GenerateFlashcardsRequest):
    context = _get_notebook_context(req.notebook_id)
    cards_data = generate_flashcards(context, req.topic)
    
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
    quiz_data = generate_quiz(context, req.num_questions, req.difficulty)
    
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
    # For prototype, we'll mock the study guide generation to save LLM tokens.
    # Normally this would call an LLM with the notebook context.
    guide = """# Study Guide

## 1. Key Concepts
* Concept A: Explanation and details.
* Concept B: Explanation and details.

## 2. Important Relationships
How A relates to B.

## 3. Practice Questions
1. What is the significance of A?
2. Compare and contrast A and B.
"""
    return {"guide": guide}
