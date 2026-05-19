import logging
from langchain_groq import ChatGroq
from app.config import settings
from app.services.json_utils import robust_parse_json

logger = logging.getLogger(__name__)

def generate_quiz(context: str, num_questions: int = 5, difficulty: str = "medium") -> list[dict]:
    """Generates a multiple choice quiz from source context using Groq Llama 3."""
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is missing")
        
    llm = ChatGroq(
        model_name="llama-3.1-8b-instant",
        api_key=settings.GROQ_API_KEY,
        temperature=0.4
    )
    
    prompt = f"""
    You are an expert educator. Create a {difficulty} difficulty, {num_questions}-question multiple-choice quiz based on the provided text.
    Ensure questions test comprehension and application, not just rote memorization.
    
    Source Text:
    {context[:15000]} # Limit context window
    
    Respond STRICTLY in the following JSON array format, and nothing else:
    [
        {{
            "question": "The question text...",
            "options": ["A", "B", "C", "D"],
            "correct_index": 0, // Integer 0-3
            "explanation": "Why this answer is correct...",
            "bloom_level": "understand" // remember, understand, apply, analyze
        }}
    ]
    """
    
    try:
        response = llm.invoke(prompt)
        quiz = robust_parse_json(response.content)
        if isinstance(quiz, list):
            return quiz
        elif isinstance(quiz, dict) and "questions" in quiz:
            return quiz["questions"]
        return []
    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        return []
