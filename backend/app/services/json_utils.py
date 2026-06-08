import json
import re

def repair_and_parse_json(raw_text: str) -> dict:
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass

    # Try to strip markdown code blocks
    cleaned = re.sub(r'^```json\s*', '', raw_text)
    cleaned = re.sub(r'^```\s*', '', cleaned)
    cleaned = re.sub(r'```\s*$', '', cleaned)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # If that fails, try using json_repair
    try:
        from json_repair import repair_json
        return json.loads(repair_json(cleaned))
    except Exception:
        raise ValueError(f"Could not parse LLM output into JSON: {raw_text}")
