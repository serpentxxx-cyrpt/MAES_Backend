import re

def sanitize_student_input(text: str) -> str:
    """
    Sanitizes user input to prevent prompt injection and XSS.
    Strips HTML tags and limits length.
    """
    if not text:
        return ""
    
    # Limit length
    text = text[:2000]
    
    # Strip HTML tags (simple regex for prototype)
    clean_text = re.sub(r'<[^>]+>', '', text)
    
    return clean_text.strip()

def wrap_for_llm(sanitized_text: str) -> str:
    """
    Wraps student input in XML tags so the LLM treats it strictly as data,
    defending against prompt injection.
    """
    return f"<student_input>\n{sanitized_text}\n</student_input>"
