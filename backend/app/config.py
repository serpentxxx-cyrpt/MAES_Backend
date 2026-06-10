# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

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
    
    # Component 1 deviation: Groq for A, Mistral for B & P
    agent_a_model: str = "llama-3.3-70b-versatile"
    agent_b_model: str = "mistral-large-latest"
    agent_p_model: str = "mistral-large-latest"
    fallback_model: str = "mistralai/mistral-7b-instruct"
    
    session_ttl_minutes: int = 30

settings = Settings()
