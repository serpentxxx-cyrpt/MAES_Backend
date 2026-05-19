import json
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# Neon uses raw psycopg. Since we may deploy on serverless environments,
# connection pooling is recommended, but for this prototype we'll use a direct connection
# or an HTTP proxy if psycopg fails.

def get_neon_conn():
    """Returns a raw DB connection for logging audit events directly via Neon Postgres."""
    if not settings.NEON_DATABASE_URL:
        logger.warning("Neon DB credentials missing. Audit logs will be disabled.")
        return None
        
    try:
        try:
            import psycopg
            conn = psycopg.connect(settings.NEON_DATABASE_URL)
            return conn
        except ImportError:
            # Fallback for Windows if psycopg3 is installed as psycopg[binary] or not found
            # Attempt to use psycopg2 if it exists
            import psycopg2
            conn = psycopg2.connect(settings.NEON_DATABASE_URL)
            return conn
    except Exception as e:
        logger.error(f"Failed to connect to Neon Audit DB: {e}")
        return None

def log_audit_event(session_id: str, student_id: str, event_type: str, metadata: dict):
    """Fire and forget audit log to Neon database."""
    conn = get_neon_conn()
    if not conn:
        return
        
    try:
        with conn.cursor() as cur:
            # We assume a table exists: audit_logs(id uuid, session_id text, student_id text, event_type text, metadata jsonb, created_at timestamp)
            cur.execute(
                """
                INSERT INTO audit_logs (session_id, student_id, event_type, metadata)
                VALUES (%s, %s, %s, %s)
                """,
                (session_id, student_id, event_type, json.dumps(metadata))
            )
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to log audit event to Neon: {e}")
    finally:
        conn.close()
