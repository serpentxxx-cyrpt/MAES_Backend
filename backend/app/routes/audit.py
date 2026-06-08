from fastapi import APIRouter
from app.db.neon_client import get_neon_conn
import datetime
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/audit", tags=["Audit & Dashboard"])

@router.get("/dashboard/summary")
async def get_dashboard_summary():
    """Fetches session performance metrics and recent logs from Neon DB asynchronously."""
    conn = None
    try:
        conn = await get_neon_conn()
        
        # Execute query asynchronously using asyncpg
        rows = await conn.fetch("""
            SELECT 
                session_id, 
                MAX(student_id) as student_id, 
                COUNT(*) as turns,
                AVG((metadata->'scores'->>'hint_quality')::numeric) as avg_hint_quality,
                AVG((metadata->'scores'->>'bloom_alignment')::numeric) as avg_bloom_alignment
            FROM audit_logs
            WHERE event_type = 'agent_b_done'
            GROUP BY session_id
            ORDER BY MAX(created_at) DESC
            LIMIT 50
        """)
        
        sessions = []
        for row in rows:
            sessions.append({
                "session_id": row["session_id"],
                "student_id": row["student_id"],
                "domain": "Socratic Computer Science",
                "started_at": datetime.datetime.now().isoformat(), # approximate
                "avg_hint_quality": float(row["avg_hint_quality"]) if row["avg_hint_quality"] is not None else 0.0,
                "avg_bloom": float(row["avg_bloom_alignment"]) if row["avg_bloom_alignment"] is not None else 0.0,
                "turns": row["turns"]
            })
            
        return {"sessions": sessions}
        
    except Exception as e:
        logger.error(f"Failed to fetch audit log summary from Neon DB: {e}")
        # Return empty list if connection fails
        return {"sessions": []}
    finally:
        if conn:
            await conn.close()

@router.get("/logs/{session_id}")
async def get_audit_logs(session_id: str):
    """Fetches the real-time telemetry stream for a specific session."""
    conn = None
    try:
        conn = await get_neon_conn()
        rows = await conn.fetch("""
            SELECT 
                id, 
                created_at, 
                event_type, 
                metadata
            FROM audit_logs
            WHERE session_id = $1
            ORDER BY created_at ASC
        """, session_id)
        
        logs = []
        for row in rows:
            meta = json.loads(row["metadata"]) if isinstance(row["metadata"], str) else (row["metadata"] or {})
            
            # Reconstruct the log object for the frontend
            status = meta.get("status", "approved" if row["event_type"] == "agent_b_done" else "pending")
            text = meta.get("text", "")
            
            logs.append({
                "id": str(row["id"]),
                "time": row["created_at"].strftime("%H:%M:%S"),
                "event": row["event_type"],
                "text": text,
                "status": status
            })
        return {"logs": logs}
    except Exception as e:
        logger.error(f"Failed to fetch session audit logs: {e}")
        return {"logs": []}
    finally:
        if conn:
            await conn.close()

