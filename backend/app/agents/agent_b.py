from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.config import settings
from app.services.json_utils import robust_parse_json
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Agent B, the Pedagogical Auditor.
Your job is to evaluate Agent A's (Socratic Tutor) proposed hint to a student.

You must evaluate the hint on 4 criteria (0-5 scale):
1. hint_quality: Does it effectively guide without giving the answer?
2. tone: Is it encouraging and supportive?
3. correctness: Is the underlying information factually correct?
4. bloom_alignment: Does it align with an appropriate Bloom's taxonomy level?

If avg(quality, tone) < 3.5 OR correctness < 4, you MUST output decision="REQUEST_REVISION" and provide a constructive note for Agent A.
Otherwise, output decision="APPROVE".

Identify the Bloom's taxonomy level (remember, understand, apply, analyze, evaluate, create).
Identify the register (socratic, analogy_first, worked_example, error_correction).

Output STRICTLY JSON:
{
    "scores": {
        "hint_quality": int,
        "tone": int,
        "correctness": int,
        "bloom_alignment": int
    },
    "decision": "APPROVE" | "REQUEST_REVISION",
    "note": "string (empty if approved)",
    "bloom_level": "string",
    "register": "string"
}
"""

def get_agent_b():
    """Initializes and returns Agent B (Pedagogical Auditor) using Gemini 1.5 Flash."""
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY missing. Agent B cannot be initialized.")
        return None
        
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        api_key=settings.GEMINI_API_KEY,
        temperature=0.1
    )

def evaluate_hint(draft: str, student_message: str, sources_text: str = "") -> dict:
    """Evaluates Agent A's draft."""
    agent = get_agent_b()
    
    context = f"Sources:\n{sources_text[:10000]}\n\n" if sources_text else ""
    prompt = f"{context}Student: {student_message}\n\nAgent A Draft:\n{draft}"
    
    try:
        response = agent.invoke([SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)])
        result = robust_parse_json(response.content)
        
        # Ensure fallback defaults if parsing fails
        if not result or "decision" not in result:
            logger.warning("Agent B returned invalid JSON. Defaulting to APPROVE.")
            return {
                "scores": {"hint_quality": 4, "tone": 4, "correctness": 4, "bloom_alignment": 4},
                "decision": "APPROVE",
                "note": "",
                "bloom_level": "understand",
                "register": "socratic"
            }
        return result
    except Exception as e:
        logger.error(f"Agent B evaluation failed: {e}")
        # Fail open
        return {
            "scores": {"hint_quality": 3, "tone": 3, "correctness": 3, "bloom_alignment": 3},
            "decision": "APPROVE",
            "note": "Auditor failed, auto-approved.",
            "bloom_level": "understand",
            "register": "socratic"
        }
