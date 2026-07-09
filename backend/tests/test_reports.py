import io
from pathlib import Path

import duckdb
import pandas as pd
import pytest
from httpx import AsyncClient

from app.services.insights_engine import build_report_summary
from app.services.report_builder import build_csv, build_excel, build_pdf
from app.services.schema_inspector import inspect_table


@pytest.fixture
def sales_duckdb(tmp_path: Path) -> Path:
    df = pd.DataFrame(
        {
            "City": (["Chennai", "Coimbatore", "Madurai"] * 10),
            "Product": (["Gold Bangles", "Diamond Ring"] * 15),
            "Amount": [10000 + i * 500 for i in range(30)],
            "Purchase Date": [f"2024-{(i % 12) + 1:02d}-01" for i in range(30)],
        }
    )
    path = tmp_path / "sales.duckdb"
    con = duckdb.connect(str(path))
    con.register("df", df)
    con.execute("CREATE TABLE data AS SELECT * FROM df")
    con.close()
    return path


def test_report_summary_computes_kpis_and_insights(sales_duckdb: Path):
    schema = inspect_table(sales_duckdb)
    summary = build_report_summary(sales_duckdb, schema, "fid", "sales.xlsx")

    assert summary.row_count == 30
    assert any("Total" in k.label for k in summary.kpis)
    assert any("Average" in k.label for k in summary.kpis)
    assert len(summary.insights) >= 1
    # Amount is the money metric — an insight should reference it or a group leader
    assert any(i.tone == "positive" for i in summary.insights)


def test_report_summary_includes_next_month_forecast(sales_duckdb: Path):
    schema = inspect_table(sales_duckdb)
    summary = build_report_summary(sales_duckdb, schema, "fid", "sales.xlsx")
    forecast = [i for i in summary.insights if "Projected next-month" in i.title]
    assert len(forecast) == 1
    assert "estimated at" in forecast[0].detail


def test_report_summary_handles_no_money_column(tmp_path: Path):
    df = pd.DataFrame({"City": ["Chennai", "Coimbatore", "Chennai"] * 3})
    path = tmp_path / "nomoney.duckdb"
    con = duckdb.connect(str(path))
    con.register("df", df)
    con.execute("CREATE TABLE data AS SELECT * FROM df")
    con.close()

    schema = inspect_table(path)
    summary = build_report_summary(path, schema, "fid", "nomoney.csv")
    assert summary.kpis[0].label == "Total Records"
    assert len(summary.insights) >= 1


def test_build_pdf_returns_valid_pdf_bytes(sales_duckdb: Path):
    schema = inspect_table(sales_duckdb)
    summary = build_report_summary(sales_duckdb, schema, "fid", "sales.xlsx")
    pdf = build_pdf(summary, sales_duckdb)
    assert pdf.startswith(b"%PDF")
    assert len(pdf) > 1000


def test_build_excel_returns_valid_xlsx_bytes(sales_duckdb: Path):
    schema = inspect_table(sales_duckdb)
    summary = build_report_summary(sales_duckdb, schema, "fid", "sales.xlsx")
    xlsx = build_excel(summary, sales_duckdb)
    # xlsx is a zip archive
    assert xlsx.startswith(b"PK")
    assert len(xlsx) > 1000


def test_build_csv_has_header_and_rows(sales_duckdb: Path):
    csv_bytes = build_csv(sales_duckdb)
    text = csv_bytes.decode("utf-8-sig")
    lines = text.strip().splitlines()
    assert lines[0].startswith("City,Product,Amount")
    assert len(lines) == 31  # header + 30 rows


# --- Endpoint tests ---

CSV = (
    b"City,Product,Amount\n"
    b"Chennai,Gold Bangles,45000\n"
    b"Coimbatore,Diamond Ring,85000\n"
    b"Chennai,Gold Chain,30000\n"
    b"Madurai,Gold Bangles,52000\n"
)


async def _upload(client: AsyncClient, auth_headers: dict) -> str:
    files = {"file": ("sales.csv", io.BytesIO(CSV), "text/csv")}
    upload = await client.post("/api/v1/uploads", files=files, headers=auth_headers)
    file_id = upload.json()["file_id"]
    await client.post(
        f"/api/v1/uploads/{file_id}/confirm",
        json={"apply_cleaning": False},
        headers=auth_headers,
    )
    return file_id


async def test_report_summary_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/reports/x/summary")
    assert response.status_code == 401


async def test_report_summary_endpoint(client: AsyncClient, auth_headers: dict):
    file_id = await _upload(client, auth_headers)
    response = await client.get(
        f"/api/v1/reports/{file_id}/summary?file_name=sales.csv", headers=auth_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["row_count"] == 4
    assert len(body["insights"]) >= 1


async def test_download_pdf(client: AsyncClient, auth_headers: dict):
    file_id = await _upload(client, auth_headers)
    response = await client.get(
        f"/api/v1/reports/{file_id}/download?format=pdf", headers=auth_headers
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


async def test_download_excel(client: AsyncClient, auth_headers: dict):
    file_id = await _upload(client, auth_headers)
    response = await client.get(
        f"/api/v1/reports/{file_id}/download?format=excel", headers=auth_headers
    )
    assert response.status_code == 200
    assert response.content.startswith(b"PK")


async def test_download_csv(client: AsyncClient, auth_headers: dict):
    file_id = await _upload(client, auth_headers)
    response = await client.get(
        f"/api/v1/reports/{file_id}/download?format=csv", headers=auth_headers
    )
    assert response.status_code == 200
    assert b"City,Product,Amount" in response.content


async def test_download_unknown_file_returns_404(client: AsyncClient, auth_headers: dict):
    response = await client.get(
        "/api/v1/reports/does-not-exist/download?format=pdf", headers=auth_headers
    )
    assert response.status_code == 404
