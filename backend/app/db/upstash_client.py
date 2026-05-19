from redis import Redis
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def get_redis() -> Redis:
    """Returns a Redis client for Upstash Serverless Redis."""
    if not settings.UPSTASH_REDIS_REST_URL or not settings.UPSTASH_REDIS_REST_TOKEN:
        logger.warning("Upstash Redis credentials missing. Caching will be disabled.")
        return None
        
    try:
        # Standard Redis client works over standard port, but Upstash REST is HTTPS.
        # Since the requirements use standard 'redis', we assume UPSTASH_REDIS_REST_URL 
        # is actually the redis:// URI for standard client. If they use the REST API, 
        # they should use the 'upstash-redis' package. 
        # We will parse the URL. If it starts with https://, we can't use standard redis easily.
        # Assuming the user provides the redis:// or rediss:// connection string in the REST_URL var.
        
        url = settings.UPSTASH_REDIS_REST_URL
        if url.startswith("http"):
            logger.warning("Upstash URL is HTTP. The standard 'redis' package requires redis:// or rediss://.")
            return None
            
        r = Redis.from_url(url, password=settings.UPSTASH_REDIS_REST_TOKEN, decode_responses=True)
        return r
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        return None
