from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.db.upstash_client import redis
import time
import logging

logger = logging.getLogger(__name__)

class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Distributed Redis-based rate limiting middleware."""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Bypass health check and options requests
        if request.url.path == "/" or request.method == "OPTIONS":
            return await call_next(request)
            
        client_ip = request.client.host if request.client else "unknown-ip"
        
        # Limit to 60 requests per minute per IP
        current_minute = int(time.time() / 60)
        key = f"ratelimit:{client_ip}:{current_minute}"
        
        try:
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, 60)
                
            if count > 60:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Limit is 60 requests per minute."}
                )
        except Exception as e:
            # If Redis connection fails, log error and allow request (failsafe)
            logger.error(f"Rate limiting cache error: {e}")
            
        return await call_next(request)
