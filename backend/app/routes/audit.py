from fastapi import APIRouter
from app.db.neon_client import get_neon_pool
import datetime
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/audit", tags=["Audit & Dashboard"])

@router.get("/dashboard/summary")
async def get_dashboard_summary():
    """Fetches session performance metrics and recent logs from Neon DB."""
    try:
        pool = get_neon_pool()
        async with pool.acquire() as conn:
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
                    "started_at": datetime.datetime.now().isoformat(),
                    "avg_hint_quality": float(row["avg_hint_quality"]) if row["avg_hint_quality"] is not None else 0.0,
                    "avg_bloom": float(row["avg_bloom_alignment"]) if row["avg_bloom_alignment"] is not None else 0.0,
                    "turns": row["turns"]
                })
            return {"sessions": sessions}
    except Exception as e:
        logger.error(f"Failed to fetch audit log summary: {e}")
        return {"sessions": []}


@router.get("/logs/{session_id}")
async def get_audit_logs(session_id: str):
    """Fetches the real-time telemetry stream for a specific session."""
    try:
        pool = get_neon_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, created_at, event_type, metadata
                FROM audit_logs
                WHERE session_id = $1
                ORDER BY created_at ASC
            """, session_id)
            logs = []
            for row in rows:
                meta = json.loads(row["metadata"]) if isinstance(row["metadata"], str) else (row["metadata"] or {})
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


@router.get("/bloom-progression/{session_id}")
async def get_bloom_progression(session_id: str):
    """Returns per-turn Bloom taxonomy levels for the radar chart."""
    try:
        pool = get_neon_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT 
                    (metadata->>'turn_number')::int as turn_number,
                    metadata->>'bloom_tag_student' as bloom_student,
                    metadata->>'bloom_tag_hint' as bloom_hint
                FROM audit_logs
                WHERE session_id = $1 AND event_type = 'agent_b_done'
                ORDER BY created_at ASC
            """, session_id)
        
        bloom_levels = ["remember", "understand", "apply", "analyze", "evaluate", "create"]
        # Aggregate counts per bloom level
        counts = {lvl: 0 for lvl in bloom_levels}
        turns = []
        for row in rows:
            lvl = row["bloom_student"] or "remember"
            if lvl in counts:
                counts[lvl] += 1
            turns.append({"turn": row["turn_number"], "bloom_student": lvl, "bloom_hint": row["bloom_hint"]})
        
        radar_data = [{"bloom": lvl, "count": counts[lvl]} for lvl in bloom_levels]
        return {"radar_data": radar_data, "turns": turns}
    except Exception as e:
        logger.error(f"[AUDIT] bloom-progression error: {e}")
        return {"radar_data": [], "turns": []}


@router.get("/cls-heatmap/{session_id}")
async def get_cls_heatmap(session_id: str):
    """Returns per-turn CLS scores from pedagogy_metrics for the heatmap."""
    try:
        pool = get_neon_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT turn_number, cls_score, bloom_stall_count, active_misconception
                FROM pedagogy_metrics
                WHERE session_id = $1
                ORDER BY turn_number ASC
            """, session_id)
        
        heatmap = [{
            "turn": row["turn_number"],
            "cls": float(row["cls_score"] or 0.0),
            "bloom_stall": row["bloom_stall_count"] or 0,
            "misconception": row["active_misconception"]
        } for row in rows]
        return {"heatmap": heatmap}
    except Exception as e:
        logger.error(f"[AUDIT] cls-heatmap error: {e}")
        return {"heatmap": []}


@router.get("/gcd-timeline/{student_id}")
async def get_gcd_timeline(student_id: str):
    """Returns the full GCD misconception history for the timeline."""
    try:
        pool = get_neon_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, concept, misconception_text, detected_at, resolved_at
                FROM gcd_profiles
                WHERE student_id = $1
                ORDER BY detected_at DESC
            """, student_id)
        
        timeline = [{
            "id": str(row["id"]),
            "concept": row["concept"],
            "misconception": row["misconception_text"],
            "detected_at": row["detected_at"].isoformat() if row["detected_at"] else None,
            "resolved_at": row["resolved_at"].isoformat() if row["resolved_at"] else None,
            "resolved": row["resolved_at"] is not None
        } for row in rows]
        return {"timeline": timeline}
    except Exception as e:
        logger.error(f"[AUDIT] gcd-timeline error: {e}")
        return {"timeline": []}
