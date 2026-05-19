from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.config import settings
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Agent S, the Fallback Socratic Tutor.
You are only invoked when the primary agents (A and B) are unavailable or experiencing errors.
Your goal is to guide the student to the answer without ever giving it to them directly.
Keep your responses concise and supportive.
"""

def get_agent_s():
    """Initializes and returns Agent S (Fallback) using OpenRouter Mistral."""
    if not settings.OPENROUTER_API_KEY:
        logger.warning("OPENROUTER_API_KEY missing. Agent S cannot be initialized.")
        return None
        
    return ChatOpenAI(
        model_name="mistralai/mistral-7b-instruct:free",
        openai_api_key=settings.OPENROUTER_API_KEY,
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=0.7
    )

def fallback_hint(student_message: str, sources_text: str = "") -> str:
    """Generates a fallback hint directly to the student, skipping the auditor."""
    agent = get_agent_s()
    
    if not agent:
        return "The system is currently experiencing high load and cannot generate a response. Please try again later."
        
    context = f"Sources:\n{sources_text[:5000]}\n\n" if sources_text else ""
    prompt = f"{context}Student: {student_message}"
    
    try:
        response = agent.invoke([SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)])
        return response.content
    except Exception as e:
        logger.error(f"Fallback Agent S failed: {e}")
        return "I'm having a lot of trouble thinking right now. Please try again in a few minutes."
