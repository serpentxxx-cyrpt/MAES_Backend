# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_env: str = "development"
    secret_key: str
    
    supabase_url: str
    supabase_service_role_key: str
    supabase_db_url: str
    
    neon_database_url: str
    
    upstash_redis_rest_url: str
    upstash_redis_rest_token: str
    
    groq_api_key: str
    gemini_api_key: str
    openrouter_api_key: str
    mistral_api_key: str
    
    agent_a_model: str = "llama-3.1-8b-instant"
    agent_b_model: str = "gemini-3.5-flash"
    fallback_model: str = "mistralai/mistral-7b-instruct"
    
    session_ttl_minutes: int = 30

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
