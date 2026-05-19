import logging
from langchain_groq import ChatGroq
from app.config import settings
from app.services.json_utils import robust_parse_json

logger = logging.getLogger(__name__)

def generate_flashcards(context: str, topic: str = None) -> list[dict]:
    """Generates flashcards from source context using Groq Llama 3."""
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is missing")
        
    llm = ChatGroq(
        model_name="llama-3.1-8b-instant",
        api_key=settings.GROQ_API_KEY,
        temperature=0.3
    )
    
    topic_str = f"Focus specifically on the topic: {topic}" if topic else "Cover the main concepts comprehensively."
    
    prompt = f"""
    You are an expert educator. Extract key facts, definitions, and concepts from the provided text and convert them into high-quality flashcards.
    {topic_str}
    
    Source Text:
    {context[:15000]} # Limit context window
    
    Respond STRICTLY in the following JSON array format, and nothing else:
    [
        {{"front": "Question or concept...", "back": "Answer or definition..."}},
        ...
    ]
    Generate 5 to 10 flashcards.
    """
    
    try:
        response = llm.invoke(prompt)
        cards = robust_parse_json(response.content)
        if isinstance(cards, list):
            return cards
        elif isinstance(cards, dict) and "flashcards" in cards:
            return cards["flashcards"]
        return []
    except Exception as e:
        logger.error(f"Flashcard generation failed: {e}")
        return []
