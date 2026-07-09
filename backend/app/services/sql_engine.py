import re
from dataclasses import dataclass
from pathlib import Path

import duckdb

from app.core.config import settings
from app.schemas.chat import ChatHistoryMessage
from app.services.claude_client import get_claude_client
from app.services.json_safe import dataframe_to_records
from app.services.prompt_utils import format_history_for_prompt
from app.services.schema_inspector import TableSchema

SQL_SYSTEM_PROMPT = """You are an expert DuckDB SQL generator for a jewellery retail analytics tool.

You will be given a table schema, a few sample rows, and a user's natural-language \
question about a jewellery shop's customer/sales data. Generate a single valid \
DuckDB SQL query that answers the question.

Rules:
- Query only the table named "data".
- Column names may contain spaces or mixed case — always wrap them in double quotes exactly as given.
- Return ONLY the raw SQL query. No explanation, no markdown code fences, no comments.
- Prefer clear aggregate queries (COUNT, SUM, AVG, etc.) with meaningful column aliases.
- If the question asks for a ranking or "top N", use ORDER BY and LIMIT.
- Cap result rows at 50 with LIMIT unless the question clearly needs fewer.
- If the question is ambiguous, make a reasonable assumption rather than asking for clarification.
- Never use INSERT, UPDATE, DELETE, DROP, ALTER, ATTACH, COPY, or any statement that
  modifies data or touches the filesystem — SELECT queries only.
"""

FORBIDDEN_SQL_PATTERN = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|ATTACH|DETACH|COPY|CREATE|PRAGMA|EXPORT|IMPORT|CALL)\b",
    re.IGNORECASE,
)

MAX_SQL_RETRIES = 2


class SqlGenerationError(Exception):
    pass


class UnsafeSqlError(Exception):
    pass


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    return text.strip().rstrip(";")


def _assert_safe(sql: str) -> None:
    if not sql.lstrip().upper().startswith("SELECT") and not sql.lstrip().upper().startswith("WITH"):
        raise UnsafeSqlError("Generated query must be a SELECT statement.")
    if FORBIDDEN_SQL_PATTERN.search(sql):
        raise UnsafeSqlError("Generated query contains a disallowed statement.")


async def generate_sql(
    question: str, schema: TableSchema, history: list[ChatHistoryMessage]
) -> str:
    client = get_claude_client()
    user_content = (
        f"{schema.as_prompt_text()}\n\n{format_history_for_prompt(history)}Question: {question}"
    )

    response = await client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=1024,
        temperature=0,
        system=SQL_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )
    sql = _strip_code_fences(response.content[0].text)
    _assert_safe(sql)
    return sql


async def regenerate_sql_after_error(
    question: str,
    schema: TableSchema,
    failed_sql: str,
    error_message: str,
    history: list[ChatHistoryMessage],
) -> str:
    client = get_claude_client()
    user_content = (
        f"{schema.as_prompt_text()}\n\n{format_history_for_prompt(history)}Question: {question}\n\n"
        f"Your previous query failed to execute:\n{failed_sql}\n\n"
        f"Error: {error_message}\n\n"
        f"Fix the query and return only the corrected SQL."
    )

    response = await client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=1024,
        temperature=0,
        system=SQL_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )
    sql = _strip_code_fences(response.content[0].text)
    _assert_safe(sql)
    return sql


@dataclass
class QueryResult:
    sql: str
    columns: list[str]
    rows: list[dict]


def execute_sql(duckdb_path: Path, sql: str) -> QueryResult:
    con = duckdb.connect(str(duckdb_path), read_only=True)
    try:
        result = con.execute(sql)
        columns = [desc[0] for desc in result.description]
        df = result.fetchdf()
        rows = dataframe_to_records(df)
        return QueryResult(sql=sql, columns=columns, rows=rows)
    finally:
        con.close()


async def generate_and_execute(
    question: str,
    schema: TableSchema,
    duckdb_path: Path,
    history: list[ChatHistoryMessage],
) -> QueryResult:
    sql = await generate_sql(question, schema, history)
    last_error: Exception | None = None

    for attempt in range(MAX_SQL_RETRIES + 1):
        try:
            return execute_sql(duckdb_path, sql)
        except UnsafeSqlError:
            raise
        except Exception as exc:  # duckdb raises many different error subclasses
            last_error = exc
            if attempt >= MAX_SQL_RETRIES:
                break
            sql = await regenerate_sql_after_error(
                question, schema, sql, str(exc), history
            )

    raise SqlGenerationError(
        f"Could not answer that question after {MAX_SQL_RETRIES + 1} attempts: {last_error}"
    )
