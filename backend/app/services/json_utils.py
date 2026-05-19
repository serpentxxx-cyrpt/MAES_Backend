import json
import logging
import re
from json_repair import repair_json

logger = logging.getLogger(__name__)

def robust_parse_json(text: str) -> dict:
    """
    Attempts to parse JSON from an LLM response.
    1. Extracts JSON blocks using regex.
    2. Attempts standard json.loads.
    3. Falls back to json-repair for malformed strings.
    """
    if not text:
        return {}
        
    # Step 1: Try to find a JSON block if wrapped in markdown
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    json_str = match.group(1) if match else text
    
    # Step 2: Clean up common LLM prefix issues
    json_str = json_str.strip()
    if json_str.startswith("json"):
        json_str = json_str[4:].strip()
        
    # Step 3: Parse
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        logger.warning(f"Failed standard JSON parse, attempting repair. Snippet: {json_str[:100]}")
        try:
            # Step 4: Fallback to json-repair library
            repaired = repair_json(json_str, return_objects=True)
            if isinstance(repaired, dict):
                return repaired
            elif isinstance(repaired, list) and len(repaired) > 0:
                # Sometimes LLMs wrap the object in a list
                return repaired[0]
            else:
                logger.error("json-repair could not return a dictionary.")
                return {}
        except Exception as e:
            logger.error(f"Total JSON parse failure: {e}")
            return {}
