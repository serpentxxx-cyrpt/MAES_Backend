from fastapi import APIRouter
from app.db.neon_client import get_neon_conn
import datetime

router = APIRouter(prefix="/audit", tags=["Audit & Dashboard"])

@router.get("/dashboard/summary")
async def get_dashboard_summary():
    # If Neon DB is not connected, return mock data for prototype
    conn = get_neon_conn()
    if not conn:
        return {
            "sessions": [
                {
                    "session_id": "sim_1",
                    "student_id": "student_x",
                    "domain": "Calculus",
                    "started_at": datetime.datetime.now().isoformat(),
                    "avg_hint_quality": 4.2,
                    "avg_bloom": 3.5,
                    "turns": 12
                },
                {
                    "session_id": "sim_2",
                    "student_id": "student_y",
                    "domain": "History",
                    "started_at": (datetime.datetime.now() - datetime.timedelta(days=1)).isoformat(),
                    "avg_hint_quality": 4.8,
                    "avg_bloom": 4.0,
                    "turns": 8
                }
            ]
        }
        
    try:
        # In a real app, this would aggregate data from the audit_logs table
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    session_id, 
                    MAX(student_id) as student_id, 
                    COUNT(*) as turns,
                    AVG((metadata->'scores'->>'hint_quality')::numeric) as avg_hint_quality
                FROM audit_logs
                WHERE event_type = 'agent_b_done'
                GROUP BY session_id
                ORDER BY MAX(created_at) DESC
                LIMIT 50
            """)
            rows = cur.fetchall()
            
            sessions = []
            for row in rows:
                sessions.append({
                    "session_id": row[0],
                    "student_id": row[1],
                    "domain": "General", # Would join with sessions table
                    "started_at": datetime.datetime.now().isoformat(),
                    "avg_hint_quality": float(row[3]) if row[3] else 0,
                    "avg_bloom": 3.0,
                    "turns": row[2]
                })
            return {"sessions": sessions}
    except Exception as e:
        return {"error": str(e), "sessions": []}
    finally:
        conn.close()
