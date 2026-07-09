import io

from httpx import AsyncClient

CSV = (
    b"City,Product,Amount\n"
    b"Chennai,Gold Bangles,45000\n"
    b"Coimbatore,Diamond Ring,85000\n"
    b"Chennai,Gold Chain,30000\n"
    b"Madurai,Gold Bangles,52000\n"
)


async def test_analytics_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/analytics/some-file")
    assert response.status_code == 401


async def test_analytics_returns_404_for_unknown_file(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/analytics/does-not-exist", headers=auth_headers)
    assert response.status_code == 404


async def test_analytics_returns_auto_generated_charts(
    client: AsyncClient, auth_headers: dict
):
    files = {"file": ("sales.csv", io.BytesIO(CSV), "text/csv")}
    upload = await client.post("/api/v1/uploads", files=files, headers=auth_headers)
    file_id = upload.json()["file_id"]

    await client.post(
        f"/api/v1/uploads/{file_id}/confirm",
        json={"apply_cleaning": False},
        headers=auth_headers,
    )

    response = await client.get(f"/api/v1/analytics/{file_id}", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["row_count"] == 4
    assert len(body["charts"]) > 0
