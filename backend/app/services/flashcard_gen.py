from groq import AsyncGroq
from app.config import settings
import logging
from app.services.json_utils import repair_and_parse_json

logger = logging.getLogger(__name__)

async def generate_flashcards(context: str, topic: str = None, history: list = None) -> list[dict]:
    """Generates flashcards from source context and chat history using Groq Llama 3 asynchronously."""
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is missing")
        
    client = AsyncGroq(api_key=settings.groq_api_key)
    
    topic_str = f"Focus specifically on the topic: {topic}" if topic else "Cover the main concepts comprehensively."
    
    history_context = ""
    if history:
        recent_topics = [h.get("content", "") for h in history if h.get("role") == "student"][-5:]
        if recent_topics:
            history_context = f"\nRecent student chat discussion topics to draw inspiration from: {', '.join(recent_topics)}"
    
    prompt = f"""
    You are an expert educator. Extract key facts, definitions, and concepts from the provided text and chat history, and convert them into high-quality flashcards.
    {topic_str}
    {history_context}
    
    Source Text:
    {context[:15000]}
    
    Respond STRICTLY in the following JSON array format inside a JSON object wrapper with key "flashcards", and nothing else:
    {{
      "flashcards": [
        {{"front": "Question or concept...", "back": "Answer or definition..."}},
        ...
      ]
    }}
    Generate 5 to 10 flashcards.
    """
    
    try:
        response = await client.chat.completions.create(
            model=settings.agent_a_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=800,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        cards = repair_and_parse_json(content)
        if isinstance(cards, list):
            return cards
        elif isinstance(cards, dict):
            for key in ["flashcards", "cards", "data"]:
                if key in cards and isinstance(cards[key], list):
                    return cards[key]
            return [cards]
        return []
    except Exception as e:
        logger.error(f"Flashcard generation failed: {e}")
        return []

