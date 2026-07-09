import base64
import io
import json

from httpx import AsyncClient

from app.services import answer_engine, sql_engine
from tests.fakes import FakeClaudeClient

CSV = b"City,Product,Amount\nChennai,Gold Bangles,45000\nCoimbatore,Diamond Ring,85000\n"


async def _upload_and_confirm(client: AsyncClient, auth_headers: dict) -> str:
    files = {"file": ("sales.csv", io.BytesIO(CSV), "text/csv")}
    upload = await client.post("/api/v1/uploads", files=files, headers=auth_headers)
    file_id = upload.json()["file_id"]

    confirm = await client.post(
        f"/api/v1/uploads/{file_id}/confirm",
        json={"apply_cleaning": False},
        headers=auth_headers,
    )
    assert confirm.status_code == 200
    return file_id


async def test_ask_requires_auth(client: AsyncClient):
    response = await client.post(
        "/api/v1/chat/ask", json={"file_id": "x", "question": "How many rows?"}
    )
    assert response.status_code == 401


async def test_ask_returns_404_for_unknown_file(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/chat/ask",
        json={"file_id": "does-not-exist", "question": "How many rows?"},
        headers=auth_headers,
    )
    assert response.status_code == 404


async def test_ask_streams_generated_answer(
    client: AsyncClient, auth_headers: dict, monkeypatch
):
    file_id = await _upload_and_confirm(client, auth_headers)

    sql_fake = FakeClaudeClient(create_texts=["SELECT COUNT(*) AS total FROM data"])
    answer_fake = FakeClaudeClient(
        stream_chunks=["You have ", "**2** customers on record."]
    )
    monkeypatch.setattr(sql_engine, "get_claude_client", lambda: sql_fake)
    monkeypatch.setattr(answer_engine, "get_claude_client", lambda: answer_fake)

    response = await client.post(
        "/api/v1/chat/ask",
        json={"file_id": file_id, "question": "How many customers do I have?"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.text == "You have **2** customers on record."


async def test_ask_falls_back_gracefully_after_repeated_sql_failures(
    client: AsyncClient, auth_headers: dict, monkeypatch
):
    file_id = await _upload_and_confirm(client, auth_headers)

    sql_fake = FakeClaudeClient(
        create_texts=[
            'SELECT "Nope1" FROM data',
            'SELECT "Nope2" FROM data',
            'SELECT "Nope3" FROM data',
        ]
    )
    monkeypatch.setattr(sql_engine, "get_claude_client", lambda: sql_fake)

    response = await client.post(
        "/api/v1/chat/ask",
        json={"file_id": file_id, "question": "Something unanswerable"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert "rephrasing" in response.text.lower()


async def test_ask_attaches_chart_spec_header_for_chartable_result(
    client: AsyncClient, auth_headers: dict, monkeypatch
):
    file_id = await _upload_and_confirm(client, auth_headers)

    sql_fake = FakeClaudeClient(
        create_texts=['SELECT City AS city, SUM(Amount) AS total FROM data GROUP BY city']
    )
    answer_fake = FakeClaudeClient(stream_chunks=["Coimbatore leads."])
    monkeypatch.setattr(sql_engine, "get_claude_client", lambda: sql_fake)
    monkeypatch.setattr(answer_engine, "get_claude_client", lambda: answer_fake)

    response = await client.post(
        "/api/v1/chat/ask",
        json={"file_id": file_id, "question": "Show revenue by city"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert "X-Chart-Spec" in response.headers
    chart = json.loads(base64.b64decode(response.headers["X-Chart-Spec"]))
    assert chart["type"] in ("bar", "pie")
    assert chart["x_key"] == "city"
    assert len(chart["data"]) == 2


async def test_ask_omits_chart_header_for_single_value_result(
    client: AsyncClient, auth_headers: dict, monkeypatch
):
    file_id = await _upload_and_confirm(client, auth_headers)

    sql_fake = FakeClaudeClient(create_texts=["SELECT COUNT(*) AS total FROM data"])
    answer_fake = FakeClaudeClient(stream_chunks=["You have 2 customers."])
    monkeypatch.setattr(sql_engine, "get_claude_client", lambda: sql_fake)
    monkeypatch.setattr(answer_engine, "get_claude_client", lambda: answer_fake)

    response = await client.post(
        "/api/v1/chat/ask",
        json={"file_id": file_id, "question": "How many customers?"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert "X-Chart-Spec" not in response.headers


async def test_ask_returns_503_when_claude_not_configured(
    client: AsyncClient, auth_headers: dict
):
    file_id = await _upload_and_confirm(client, auth_headers)

    # No monkeypatch here — ANTHROPIC_API_KEY is empty in the test environment,
    # so this exercises the real "not configured" path.
    response = await client.post(
        "/api/v1/chat/ask",
        json={"file_id": file_id, "question": "How many rows?"},
        headers=auth_headers,
    )
    assert response.status_code == 503
