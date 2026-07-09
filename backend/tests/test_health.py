from httpx import AsyncClient


async def test_root(client: AsyncClient) -> None:
    response = await client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["service"] == "Jewellery AI Analytics API"


async def test_health_check(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"


async def test_response_has_request_id_header(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert "X-Request-ID" in response.headers
    assert "X-Process-Time-Ms" in response.headers
