import asyncpg
import json
import logging
from app.config import settings

logger = logging.getLogger(__name__)

_pool = None

async def init_neon_pool():
    global _pool
    if not _pool:
        _pool = await asyncpg.create_pool(settings.neon_database_url, min_size=1, max_size=10)
        logger.info("Neon database connection pool initialized.")

async def close_neon_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("Neon database connection pool closed.")

def get_neon_pool():
    if not _pool:
        raise RuntimeError("Neon connection pool is not initialized.")
    return _pool

async def log_audit_entry(session_id: str, student_id: str, turn_number: int, data: dict):
    """Logs an agent turn audit event to the Neon database."""
    pool = get_neon_pool()
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
        
        async with pool.acquire() as conn:
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
    except Exception as e:
        logger.error(f"Failed to log audit entry: {e}")

async def log_event(session_id: str, student_id: str, event_type: str, text: str, status: str):
    """Logs a raw telemetry event to the Neon DB."""
    pool = get_neon_pool()
    try:
        metadata = {
            "text": text,
            "status": status
        }
        async with pool.acquire() as conn:
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
        logger.error(f"Failed to log event: {e}")

