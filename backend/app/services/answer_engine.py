import json
from collections.abc import AsyncGenerator

from app.core.config import settings
from app.schemas.chat import ChatHistoryMessage
from app.services.claude_client import get_claude_client
from app.services.prompt_utils import format_history_for_prompt
from app.services.sql_engine import QueryResult

ANSWER_SYSTEM_PROMPT = """You are a knowledgeable jewellery business analyst speaking \
directly to a shop owner. You will be given their question and the data that answers \
it — respond as if you already know this about their business.

Rules:
- Never mention SQL, queries, databases, or how the answer was computed.
- Use ₹ for currency amounts unless the data clearly indicates another currency.
- Format your answer in markdown: **bold** key numbers, use a markdown table for
  multi-row results, use bullet points for lists.
- Be concise — a few sentences or a small table, not an essay.
- If the data is empty, say so plainly and suggest the customer rephrase the question.
"""


async def stream_answer(
    question: str, result: QueryResult, history: list[ChatHistoryMessage]
) -> AsyncGenerator[str, None]:
    client = get_claude_client()
    result_preview = json.dumps(result.rows[:50], default=str)
    user_content = (
        f"{format_history_for_prompt(history)}Question: {question}\n\n"
        f"Data result ({len(result.rows)} row(s), columns: {', '.join(result.columns)}):\n"
        f"{result_preview}"
    )

    async with client.messages.stream(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=1024,
        system=ANSWER_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    ) as stream:
        async for text in stream.text_stream:
            yield text
