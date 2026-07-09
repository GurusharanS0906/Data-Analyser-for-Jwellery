from collections.abc import AsyncIterator
from functools import lru_cache

from google import genai
from google.genai import types

from app.core.config import settings


class GeminiNotConfiguredError(Exception):
    """Raised when GEMINI_API_KEY is not set."""


class GeminiClient:
    """Thin async adapter over the google-genai SDK. Exposes a two-method
    interface (generate / stream) so the SQL and answer engines — and their
    test doubles — stay decoupled from the SDK's call shape."""

    def __init__(self, api_key: str) -> None:
        self._client = genai.Client(api_key=api_key)

    async def generate(
        self,
        *,
        system: str,
        user: str,
        temperature: float = 0.0,
        max_output_tokens: int = 1024,
    ) -> str:
        response = await self._client.aio.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
            ),
        )
        return response.text or ""

    async def stream(
        self,
        *,
        system: str,
        user: str,
        max_output_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        stream = await self._client.aio.models.generate_content_stream(
            model=settings.GEMINI_MODEL,
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=max_output_tokens,
            ),
        )
        async for chunk in stream:
            if chunk.text:
                yield chunk.text


@lru_cache
def get_gemini_client() -> GeminiClient:
    if not settings.GEMINI_API_KEY:
        raise GeminiNotConfiguredError(
            "GEMINI_API_KEY is not set — add it to backend/.env to enable AI Chat."
        )
    return GeminiClient(settings.GEMINI_API_KEY)
