from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# System prompt based on maes_fullstack_config.md specifications
SYSTEM_PROMPT = """You are Agent A, a Socratic Tutor. Your goal is to guide the student to the answer without ever giving it to them directly.
Use the provided sources (if any) to ground your knowledge.

Rules:
1. NEVER give the direct answer to the student's question.
2. Ask probing questions to lead them to the answer.
3. Use analogies if the concept is complex.
4. Keep your responses concise (under 100 words).
5. Adapt to the student's level of understanding.

If the student is frustrated, acknowledge it and break the problem down into smaller, easier steps.
"""

def get_agent_a():
    """Initializes and returns Agent A (Socratic Tutor) using Groq Llama 3.1 8b."""
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY missing. Agent A cannot be initialized.")
        return None
        
    return ChatGroq(
        model_name="llama-3.1-8b-instant",
        api_key=settings.GROQ_API_KEY,
        temperature=0.7
    )

def draft_hint(student_message: str, chat_history: list, sources_text: str = "") -> str:
    """Drafts an initial Socratic hint."""
    agent = get_agent_a()
    
    context = f"Sources:\n{sources_text[:10000]}\n\n" if sources_text else ""
    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    
    # Add history (limiting to last 5 turns to save context)
    for msg in chat_history[-10:]:
        # Chat history should be formatted as HumanMessage / AIMessage
        pass # In actual orchestration, this is passed directly via LangGraph state
        
    # Draft raw message
    messages.append(HumanMessage(content=f"{context}Student: {student_message}"))
    
    try:
        response = agent.invoke(messages)
        return response.content
    except Exception as e:
        logger.error(f"Agent A drafting failed: {e}")
        return "I'm having trouble thinking right now. Let's try again in a moment."

def revise_hint(draft: str, feedback: str, student_message: str) -> str:
    """Revises a hint based on Agent B's feedback."""
    agent = get_agent_a()
    
    prompt = f"""
    You are the Socratic Tutor. Your previous hint draft was rejected by the Pedagogical Auditor.
    
    Student's question: {student_message}
    Your rejected draft: {draft}
    Auditor's feedback: {feedback}
    
    Rewrite your hint to address the auditor's feedback perfectly. Remember: NEVER give the direct answer.
    """
    
    try:
        response = agent.invoke([SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)])
        return response.content
    except Exception as e:
        logger.error(f"Agent A revision failed: {e}")
        return draft # Fallback to original draft if revision fails
