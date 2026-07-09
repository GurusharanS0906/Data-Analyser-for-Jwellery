import json
from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Centralized, typed application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "Jewellery AI Analytics API"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)

    API_V1_PREFIX: str = "/api/v1"

    # CORS — allowed origins for the frontend. Next.js dev picks the first free
    # port starting at 3000, so a handful of fallbacks are allow-listed too.
    # NoDecode disables pydantic-settings' automatic JSON decoding of this env
    # var, so a plain comma-separated string reaches the validator below (without
    # it, the source layer tries json.loads on the raw value and errors first).
    CORS_ORIGINS: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            f"http://localhost:{port}" for port in range(3000, 3011)
        ]
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: object) -> object:
        """Accept a plain comma-separated string (e.g. from a deployment env var)
        in addition to a JSON list, so operators aren't forced to write JSON."""
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith("["):
                return json.loads(stripped)
            return [origin.strip() for origin in stripped.split(",") if origin.strip()]
        return value

    # Shared secret used to validate short-lived bridge tokens minted by the
    # Next.js server after checking the user's session (see /api/uploads/token).
    # The browser uploads directly to this API — bypassing Next.js — so large
    # files aren't constrained by Vercel's serverless request-body limits.
    JWT_SECRET_KEY: str = Field(default="dev-secret-change-me-in-production")
    JWT_ALGORITHM: str = "HS256"

    # Database (shared PostgreSQL instance managed via Prisma migrations)
    DATABASE_URL: str = Field(
        default="postgresql://jewelai:jewelai_dev_password@localhost:5433/jewelai?schema=public"
    )
    REDIS_URL: str = Field(default="redis://localhost:6380")

    # AI (Google Gemini)
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemini-2.5-flash")

    # File uploads
    UPLOAD_DIR: Path = BACKEND_ROOT / "storage" / "uploads"
    PROCESSED_DIR: Path = BACKEND_ROOT / "storage" / "processed"
    REPORT_DIR: Path = BACKEND_ROOT / "storage" / "reports"
    MAX_UPLOAD_SIZE_MB: int = 100
    ALLOWED_UPLOAD_EXTENSIONS: set[str] = Field(
        default_factory=lambda: {".xlsx", ".xls", ".csv"}
    )
    UPLOAD_PREVIEW_ROWS: int = 50

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
