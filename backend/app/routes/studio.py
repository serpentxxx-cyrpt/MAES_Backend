from fastapi import APIRouter
import uuid
import datetime
from groq import AsyncGroq
from app.db.models import GenerateFlashcardsRequest, GenerateQuizRequest, GenerateStudyGuideRequest
from app.db.supabase_client import get_supabase, get_learner_model, get_student_history
from app.services.flashcard_gen import generate_flashcards
from app.services.quiz_gen import generate_quiz
from app.config import settings


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
    """Generates a structured markdown study guide using Groq Llama 3.3-70B."""
    context = _get_notebook_context(req.notebook_id)
    if not context:
        return {"study_guide": {"markdown": "No active sources found in this notebook. Please add sources first.", "notebook_id": req.notebook_id}}
    
    STUDY_GUIDE_SYSTEM = """You are an expert educational content creator. Generate a comprehensive, well-structured study guide from the provided source material.

The study guide MUST include:
1. ## Overview (2-3 sentence summary of the topic)
2. ## Key Concepts (bullet points of the most important ideas)
3. ## Detailed Notes (organized sections with explanations)
4. ## Common Misconceptions (things students often get wrong)
5. ## Practice Questions (3-5 questions with answers)
6. ## Summary (one-paragraph wrap-up)

Use clear markdown formatting. Be educational and comprehensive."""

    client = AsyncGroq(api_key=settings.groq_api_key)
    response = await client.chat.completions.create(
        model=settings.agent_a_model,
        messages=[
            {"role": "system", "content": STUDY_GUIDE_SYSTEM},
            {"role": "user", "content": f"Generate a study guide from this source material:\n\n{context[:12000]}"}
        ],
        temperature=0.4,
        max_tokens=2000
    )
    
    markdown_content = response.choices[0].message.content
    return {
        "study_guide": {
            "id": str(uuid.uuid4()),
            "notebook_id": req.notebook_id,
            "markdown": markdown_content,
            "created_at": datetime.datetime.now().isoformat()
        }
    }
