from functools import lru_cache

from anthropic import AsyncAnthropic

from app.core.config import settings


class ClaudeNotConfiguredError(Exception):
    """Raised when ANTHROPIC_API_KEY is not set."""


@lru_cache
def get_claude_client() -> AsyncAnthropic:
    if not settings.ANTHROPIC_API_KEY:
        raise ClaudeNotConfiguredError(
            "ANTHROPIC_API_KEY is not set — add it to backend/.env to enable AI Chat."
        )
    return AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
