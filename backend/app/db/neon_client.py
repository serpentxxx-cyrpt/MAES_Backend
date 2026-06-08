import asyncpg
import json
from app.config import settings

async def get_neon_conn():
    """Establishes and returns an asyncpg connection to the Neon Postgres database."""
    return await asyncpg.connect(settings.neon_database_url)

async def log_audit_entry(session_id: str, student_id: str, turn_number: int, data: dict):
    """Logs an agent turn audit event to the Neon database."""
    conn = await get_neon_conn()
    try:
        # Construct the metadata JSON payload
        metadata = {
            "turn_number": turn_number,
            "student_message": data.get("student_message"),
            "hint_delivered": data.get("hint_delivered"),
            "bloom_tag_student": data.get("bloom_tag_student"),
            "bloom_tag_hint": data.get("bloom_tag_hint"),
            "register_at_turn": data.get("register_at_turn"),
            "decision": data.get("decision"),
            "correction_applied": data.get("correction_applied", False),
            "struggle_level": data.get("struggle_level"),
            "scores": {
                "hint_quality": data.get("score_hint_quality"),
                "tone": data.get("score_tone"),
                "correctness": data.get("score_correctness"),
                "bloom_alignment": data.get("score_bloom_align")
            }
        }
        
        await conn.execute(
            """
            INSERT INTO audit_logs (
                session_id, student_id, event_type, metadata
            ) VALUES ($1, $2, $3, $4)
            """,
            session_id,
            student_id,
            "agent_b_done",
            json.dumps(metadata)
        )
    finally:
        await conn.close()

async def log_event(session_id: str, student_id: str, event_type: str, text: str, status: str):
    """Logs a raw telemetry event to the Neon DB."""
    conn = await get_neon_conn()
    try:
        metadata = {
            "text": text,
            "status": status
        }
        await conn.execute(
            """
            INSERT INTO audit_logs (
                session_id, student_id, event_type, metadata
            ) VALUES ($1, $2, $3, $4)
            """,
            session_id,
            student_id,
            event_type,
            json.dumps(metadata)
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to log event: {e}")
    finally:
        await conn.close()

