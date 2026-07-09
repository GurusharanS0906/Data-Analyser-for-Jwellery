import base64
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.core.security import get_current_user_id
from app.schemas.chat import ChatAskRequest
from app.services import storage
from app.services.answer_engine import stream_answer
from app.services.chart_engine import build_chart_spec
from app.services.claude_client import ClaudeNotConfiguredError
from app.services.schema_inspector import inspect_table
from app.services.sql_engine import (
    SqlGenerationError,
    UnsafeSqlError,
    generate_and_execute,
)
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


async def _fallback_stream(message: str) -> AsyncGenerator[str, None]:
    yield message


@router.post("/ask", summary="Ask a natural-language question about an uploaded file")
async def ask(
    body: ChatAskRequest,
    user_id: str = Depends(get_current_user_id),
) -> StreamingResponse:
    duckdb_path = storage.duckdb_file_path(user_id, body.file_id)

    try:
        schema = inspect_table(duckdb_path)
        result = await generate_and_execute(
            body.question, schema, duckdb_path, body.history
        )
    except ClaudeNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        ) from exc
    except UnsafeSqlError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except SqlGenerationError as exc:
        logger.warning("SQL generation failed for user %s: %s", user_id, exc)
        return StreamingResponse(
            _fallback_stream(
                "I wasn't able to turn that into a query against your data. Try "
                "rephrasing the question — naming a specific column or value from "
                "your sheet usually helps."
            ),
            media_type="text/plain",
        )

    logger.info("Chat query resolved for user %s (%s rows)", user_id, len(result.rows))

    headers = {}
    chart_spec = build_chart_spec(body.question, result)
    if chart_spec:
        encoded = base64.b64encode(
            chart_spec.model_dump_json().encode("utf-8")
        ).decode("ascii")
        headers["X-Chart-Spec"] = encoded

    return StreamingResponse(
        stream_answer(body.question, result, body.history),
        media_type="text/plain",
        headers=headers,
    )
