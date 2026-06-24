from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    supabase_url: str = "https://example.supabase.co"
    supabase_service_role_key: str = "example_key"
    gemini_api_key: str = "example_key"
    gemini_model: str = "gemini-2.5-pro"
    redis_url: Optional[str] = "redis://localhost:6379"
    environment: str = "development"
    log_level: str = "INFO"
    gemini_daily_limit: int = 50
    guessmy_place_api: str = "https://Rafs-an09002-geoai-backend.hf.space"
    port: int = 7860

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()