from pathlib import Path

import duckdb
import pandas as pd
import pytest

from app.schemas.chat import ChatHistoryMessage
from app.services import sql_engine
from app.services.schema_inspector import inspect_table
from app.services.sql_engine import (
    SqlGenerationError,
    UnsafeSqlError,
    execute_sql,
    generate_and_execute,
    generate_sql,
)
from tests.fakes import FakeClaudeClient


@pytest.fixture
def sample_duckdb(tmp_path: Path) -> Path:
    df = pd.DataFrame(
        {
            "City": ["Chennai", "Coimbatore", "Chennai", "Madurai"],
            "Product": ["Gold Bangles", "Diamond Ring", "Gold Bangles", "Gold Chain"],
            "Amount": [45000, 85000, 52000, 30000],
        }
    )
    path = tmp_path / "sample.duckdb"
    con = duckdb.connect(str(path))
    con.register("df", df)
    con.execute("CREATE TABLE data AS SELECT * FROM df")
    con.close()
    return path


async def test_generate_sql_strips_code_fences_and_semicolon(monkeypatch):
    fake = FakeClaudeClient(create_texts=["```sql\nSELECT COUNT(*) FROM data;\n```"])
    monkeypatch.setattr(sql_engine, "get_claude_client", lambda: fake)

    from app.services.schema_inspector import TableSchema

    fake_schema = TableSchema(columns=[("City", "VARCHAR")], sample_rows=[], row_count=4)
    sql = await generate_sql("How many rows?", fake_schema, [])
    assert sql == "SELECT COUNT(*) FROM data"


async def test_generate_sql_rejects_unsafe_statement(monkeypatch):
    fake = FakeClaudeClient(create_texts=["DROP TABLE data"])
    monkeypatch.setattr(sql_engine, "get_claude_client", lambda: fake)

    from app.services.schema_inspector import TableSchema

    fake_schema = TableSchema(columns=[("City", "VARCHAR")], sample_rows=[], row_count=4)
    with pytest.raises(UnsafeSqlError):
        await generate_sql("Delete everything", fake_schema, [])


def test_execute_sql_runs_against_real_duckdb(sample_duckdb: Path):
    result = execute_sql(sample_duckdb, 'SELECT City, COUNT(*) AS n FROM data GROUP BY City ORDER BY n DESC')
    assert result.columns == ["City", "n"]
    assert result.rows[0]["City"] == "Chennai"
    assert result.rows[0]["n"] == 2


async def test_generate_and_execute_retries_on_bad_sql(monkeypatch, sample_duckdb: Path):
    fake = FakeClaudeClient(
        create_texts=[
            'SELECT "NoSuchColumn" FROM data',  # fails
            "SELECT COUNT(*) AS total FROM data",  # succeeds
        ]
    )
    monkeypatch.setattr(sql_engine, "get_claude_client", lambda: fake)

    schema = inspect_table(sample_duckdb)
    result = await generate_and_execute("How many rows?", schema, sample_duckdb, [])
    assert result.rows[0]["total"] == 4


async def test_generate_and_execute_gives_up_after_max_retries(monkeypatch, sample_duckdb: Path):
    fake = FakeClaudeClient(
        create_texts=[
            'SELECT "Nope1" FROM data',
            'SELECT "Nope2" FROM data',
            'SELECT "Nope3" FROM data',
        ]
    )
    monkeypatch.setattr(sql_engine, "get_claude_client", lambda: fake)

    schema = inspect_table(sample_duckdb)
    with pytest.raises(SqlGenerationError):
        await generate_and_execute("Broken question", schema, sample_duckdb, [])


async def test_generate_sql_includes_history_context(monkeypatch):
    captured = {}
    fake = FakeClaudeClient(create_texts=["SELECT 1"])

    async def capturing_create(**kwargs):
        captured["messages"] = kwargs["messages"]
        return await FakeClaudeClient().messages.create(**kwargs)

    fake.messages.create = capturing_create
    monkeypatch.setattr(sql_engine, "get_claude_client", lambda: fake)

    from app.services.schema_inspector import TableSchema

    fake_schema = TableSchema(columns=[("City", "VARCHAR")], sample_rows=[], row_count=1)
    history = [
        ChatHistoryMessage(role="user", content="Top city by revenue?"),
        ChatHistoryMessage(role="assistant", content="Chennai leads with ₹4,50,000."),
    ]
    await generate_sql("What about Coimbatore?", fake_schema, history)
    assert "Chennai leads" in captured["messages"][0]["content"]
