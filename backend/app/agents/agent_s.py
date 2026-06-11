# pyrefly: ignore [missing-import]
from openai import AsyncOpenAI
from app.config import settings
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Agent S, the Fallback Socratic Tutor.
You are only invoked when the primary agents (A and B) are unavailable or experiencing errors.
Your goal is to guide the student to the answer without ever giving it to them directly.
Keep your responses concise and supportive.
"""

def get_agent_s_client() -> AsyncOpenAI | None:
    """Initializes and returns Agent S (Fallback) client using OpenRouter."""
    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY missing. Agent S cannot be initialized.")
        return None
        
    return AsyncOpenAI(
        api_key=settings.openrouter_api_key,
        base_url="https://openrouter.ai/api/v1"
    )

async def fallback_hint(student_message: str, sources_text: str = "") -> str:
    """Generates a fallback hint directly to the student asynchronously, skipping the auditor."""
    client = get_agent_s_client()
    
    if not client:
        return "The system is currently experiencing high load and cannot generate a response. Please try again later."
        
    context = f"Sources:\n{sources_text[:5000]}\n\n" if sources_text else ""
    prompt = f"{context}Student: {student_message}"
    
    try:
        response = await client.chat.completions.create(
            model="mistralai/mistral-7b-instruct:free",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Fallback Agent S failed: {e}")
        return "I'm having a lot of trouble thinking right now. Please try again in a few minutes."

