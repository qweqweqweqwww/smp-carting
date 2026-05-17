"""
Application configuration loaded from environment variables.
All settings have sensible defaults for local race-venue deployment.
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # --- Application ---
    APP_NAME: str = "SMP Karting Race Control"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # --- Server ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # --- Database ---
    DATABASE_URL: str = "sqlite+aiosqlite:///./smp_karting.db"

    # --- Security ---
    # Used only to sign invite tokens; no user passwords in the system.
    SECRET_KEY: str = "change-me-before-first-race"
    INVITE_TOKEN_EXPIRE_HOURS: int = 72

    # --- Audio storage ---
    AUDIO_STORAGE_DIR: Path = Path("audio_storage")
    # Accepted input format from client
    AUDIO_INPUT_FORMAT: str = "wav"
    # Format persisted on server (smaller, still lossless-enough for appeals)
    AUDIO_STORAGE_FORMAT: str = "ogg"

    # --- ASR ---
    WHISPER_MODEL: str = "small"        # small | medium
    WHISPER_LANGUAGE: str = "ru"
    WHISPER_DEVICE: str = "cpu"         # cpu | cuda

    # --- CORS (useful during dev; tighten in production) ---
    CORS_ORIGINS: list[str] = ["*"]


settings = Settings()
