from upstash_redis.asyncio import Redis
from app.config import settings
import json

redis = Redis(
    url=settings.upstash_redis_rest_url,
    token=settings.upstash_redis_rest_token
)

async def get_session_context(session_id: str) -> dict | None:
    raw = await redis.get(f"session:{session_id}")
    return json.loads(raw) if raw else None

async def set_session_context(session_id: str, context: dict) -> None:
    await redis.set(
        f"session:{session_id}",
        json.dumps(context),
        ex=settings.session_ttl_minutes * 60
    )

async def delete_session(session_id: str) -> None:
    await redis.delete(f"session:{session_id}")
