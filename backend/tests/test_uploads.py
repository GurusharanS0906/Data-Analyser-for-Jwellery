import io

from httpx import AsyncClient

SAMPLE_CSV = (
    b"Name,Amount,City\n"
    b'Priya,"\xe2\x82\xb91,200",Chennai\n'
    b"Arun,500,Coimbatore\n"
    b"Lakshmi,$300.50,\n"
)


def csv_file():
    return {"file": ("customers.csv", io.BytesIO(SAMPLE_CSV), "text/csv")}


async def test_upload_requires_auth(client: AsyncClient):
    response = await client.post("/api/v1/uploads", files=csv_file())
    assert response.status_code == 401


async def test_upload_rejects_bad_extension(client: AsyncClient, auth_headers: dict):
    files = {"file": ("customers.txt", io.BytesIO(b"hello"), "text/plain")}
    response = await client.post("/api/v1/uploads", files=files, headers=auth_headers)
    assert response.status_code == 400


async def test_upload_analyzes_csv(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/uploads", files=csv_file(), headers=auth_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["row_count"] == 3
    assert body["column_count"] == 3
    assert body["has_issues"] is True
    assert "Amount" in body["issues"]["inconsistent_currency_columns"]
    assert body["issues"]["missing_values"]["City"] == 1
    return body["file_id"]


async def test_clean_and_confirm_flow(client: AsyncClient, auth_headers: dict):
    upload_response = await client.post(
        "/api/v1/uploads", files=csv_file(), headers=auth_headers
    )
    file_id = upload_response.json()["file_id"]

    clean_response = await client.post(
        f"/api/v1/uploads/{file_id}/clean", headers=auth_headers
    )
    assert clean_response.status_code == 200
    clean_body = clean_response.json()
    assert "Amount" in clean_body["summary"]["currency_columns_normalized"]

    confirm_response = await client.post(
        f"/api/v1/uploads/{file_id}/confirm",
        json={"apply_cleaning": True},
        headers=auth_headers,
    )
    assert confirm_response.status_code == 200
    confirm_body = confirm_response.json()
    assert confirm_body["row_count"] == 3
    assert confirm_body["duckdb_path"].endswith(".duckdb")


async def test_clean_unknown_file_id_returns_404(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/uploads/does-not-exist/clean", headers=auth_headers
    )
    assert response.status_code == 404
