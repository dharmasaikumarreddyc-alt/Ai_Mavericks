from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "Aisle Backend"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./aisle.db"

    # JWT Settings
    SECRET_KEY: str = "aisle-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Azure OpenAI (primary LLM backend)
    AZURE_OPENAI_ENDPOINT: Optional[str] = None
    AZURE_OPENAI_API_KEY: Optional[str] = None
    AZURE_OPENAI_DEPLOYMENT: Optional[str] = None
    AZURE_OPENAI_API_VERSION: str = "2024-12-01-preview"

    # Groq API (legacy fallback)
    GROQ_API_KEY: Optional[str] = None
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    class Config:
        env_file = ".env"
        # Env vars are read case-insensitively, and unknown keys in .env are
        # ignored so front-end-only secrets (e.g. BLAND_API_KEY) don't crash
        # backend startup when they share the same .env file.
        case_sensitive = False
        extra = "ignore"

settings = Settings()

# Create model client for AutoGen 0.4+.
# Prefers Azure OpenAI when configured; falls back to Groq otherwise.
def get_model_client():
    from autogen_core.models import ModelFamily

    if settings.AZURE_OPENAI_ENDPOINT and settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_DEPLOYMENT:
        from autogen_ext.models.openai import AzureOpenAIChatCompletionClient
        return AzureOpenAIChatCompletionClient(
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            api_key=settings.AZURE_OPENAI_API_KEY,
            model=settings.AZURE_OPENAI_DEPLOYMENT,
            model_info={
                "vision": False,
                "function_calling": True,
                "json_output": True,
                "family": ModelFamily.UNKNOWN,
            },
        )

    from autogen_ext.models.openai import OpenAIChatCompletionClient
    return OpenAIChatCompletionClient(
        model=settings.GROQ_MODEL,
        api_key=settings.GROQ_API_KEY or "",
        base_url=settings.GROQ_BASE_URL,
        model_info={
            "vision": False,
            "function_calling": True,
            "json_output": True,
            "family": ModelFamily.UNKNOWN,
        },
    )
