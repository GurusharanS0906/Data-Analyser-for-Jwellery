from types import SimpleNamespace


class FakeStream:
    def __init__(self, chunks: list[str]):
        self._chunks = chunks

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    @property
    def text_stream(self):
        return self._agen()

    async def _agen(self):
        for chunk in self._chunks:
            yield chunk


class FakeMessages:
    def __init__(self, create_texts: list[str], stream_chunks: list[str]):
        self._create_texts = list(create_texts)
        self._stream_chunks = stream_chunks

    async def create(self, **kwargs):
        text = self._create_texts.pop(0) if self._create_texts else "SELECT 1"
        return SimpleNamespace(content=[SimpleNamespace(text=text)])

    def stream(self, **kwargs):
        return FakeStream(self._stream_chunks)


class FakeClaudeClient:
    """Stand-in for AsyncAnthropic — no network calls, no API key required."""

    def __init__(
        self,
        create_texts: list[str] | None = None,
        stream_chunks: list[str] | None = None,
    ):
        self.messages = FakeMessages(
            create_texts if create_texts is not None else ["SELECT 1"],
            stream_chunks if stream_chunks is not None else ["Hello", " from Claude."],
        )
