from groq import AsyncGroq
from app.config import settings
import logging
from app.services.json_utils import repair_and_parse_json

logger = logging.getLogger(__name__)

async def generate_quiz(
    context: str, 
    num_questions: int = 5, 
    difficulty: str = "medium", 
    learner_model: dict = None, 
    history: list = None
) -> list[dict]:
    """Generates a multiple choice quiz from source context, adapted to user's Bloom levels and interests."""
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is missing")
        
    client = AsyncGroq(api_key=settings.groq_api_key)
    
    # Structure personalization context
    profile_instructions = ""
    if learner_model:
        profile_instructions += f"\n- Enforced Bloom Level Target: {learner_model.get('bloom_level_history', ['understand'])[-1]}"
        profile_instructions += f"\n- Mastered Concepts: {learner_model.get('mastered_concepts', [])}"
        profile_instructions += f"\n- Working Concepts: {learner_model.get('working_concepts', [])}"
        profile_instructions += f"\n- Preferred Pedagogical Style: {learner_model.get('preferred_style', 'socratic')}"
        
    if history:
        recent_topics = [h.get("content", "") for h in history if h.get("role") == "student"][-5:]
        if recent_topics:
            profile_instructions += f"\n- Student Recent Discussion Areas / Interests: {', '.join(recent_topics)}"
            
    personalization_prompt = ""
    if profile_instructions:
        personalization_prompt = f"""
        PERSONALIZATION ADAPTATION METRICS:
        {profile_instructions}
        
        Tailor the quiz context and scenarios to target these interest topics. 
        Formulate question difficulties to align with the student's current Bloom levels and working concepts.
        """

    prompt = f"""
    You are an expert educator. Create a {difficulty} difficulty, {num_questions}-question multiple-choice quiz based on the provided text.
    Ensure questions test comprehension and application, not just rote memorization.
    
    {personalization_prompt}
    
    Source Text:
    {context[:15000]}

    
    Respond STRICTLY in the following JSON object format containing a list under the key "questions", and nothing else:
    {{
      "questions": [
        {{
            "question": "The question text...",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_index": 0,
            "explanation": "Why this answer is correct...",
            "bloom_level": "understand"
        }}
      ]
    }}
    """
    
    try:
        response = await client.chat.completions.create(
            model=settings.agent_a_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        quiz = repair_and_parse_json(content)
        if isinstance(quiz, list):
            return quiz
        elif isinstance(quiz, dict):
            for key in ["questions", "quiz", "data"]:
                if key in quiz and isinstance(quiz[key], list):
                    return quiz[key]
            return [quiz]
        return []
    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        return []

