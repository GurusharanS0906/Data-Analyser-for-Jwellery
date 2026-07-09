from pathlib import Path

import duckdb
import pandas as pd
import pytest

from app.services.auto_analytics import classify_columns, generate_auto_charts
from app.services.schema_inspector import inspect_table


@pytest.fixture
def rich_duckdb(tmp_path: Path) -> Path:
    df = pd.DataFrame(
        {
            "Customer Name": [f"Customer {i}" for i in range(30)],
            "City": (["Chennai", "Coimbatore", "Madurai"] * 10),
            "Product": (["Gold Bangles", "Diamond Ring"] * 15),
            "Amount": [1000 + i * 137 for i in range(30)],
            "Purchase Date": [f"2024-{(i % 12) + 1:02d}-01" for i in range(30)],
        }
    )
    path = tmp_path / "rich.duckdb"
    con = duckdb.connect(str(path))
    con.register("df", df)
    con.execute(
        "CREATE TABLE data AS SELECT \"Customer Name\", City, Product, Amount, "
        "CAST(\"Purchase Date\" AS DATE) AS \"Purchase Date\" FROM df"
    )
    con.close()
    return path


def test_classify_columns_separates_by_type(rich_duckdb: Path):
    schema = inspect_table(rich_duckdb)
    numeric, text, dates = classify_columns(schema)
    assert "Amount" in numeric
    assert "City" in text
    assert "Product" in text
    assert "Customer Name" in text
    assert "Purchase Date" in dates


def test_generate_auto_charts_produces_bar_and_trend(rich_duckdb: Path):
    schema = inspect_table(rich_duckdb)
    charts = generate_auto_charts(rich_duckdb, schema)

    assert len(charts) > 0
    chart_types = [c.type for c in charts]
    assert "bar" in chart_types

    bar_chart = next(c for c in charts if c.type == "bar")
    assert bar_chart.x_key == "category"
    assert len(bar_chart.data) >= 2

    # High-cardinality "Customer Name" (30 distinct values) should never be
    # picked as a grouping column — it's an identifier, not a category.
    for chart in charts:
        assert chart.title.find("Customer Name") == -1 or "share" in chart.title.lower()


def test_generate_auto_charts_includes_monthly_trend(rich_duckdb: Path):
    schema = inspect_table(rich_duckdb)
    charts = generate_auto_charts(rich_duckdb, schema)
    trend_charts = [c for c in charts if c.type == "line"]
    assert len(trend_charts) == 1
    assert trend_charts[0].x_key == "month"


@pytest.fixture
def unclean_duckdb(tmp_path: Path) -> Path:
    """Mirrors a real upload that skipped cleaning — dates land as VARCHAR,
    not a native DuckDB DATE type."""
    df = pd.DataFrame(
        {
            "City": (["Chennai", "Coimbatore", "Madurai"] * 10),
            "Amount": [1000 + i * 137 for i in range(30)],
            "Purchase Date": [f"2024-{(i % 12) + 1:02d}-01" for i in range(30)],
        }
    )
    path = tmp_path / "unclean.duckdb"
    con = duckdb.connect(str(path))
    con.register("df", df)
    con.execute("CREATE TABLE data AS SELECT * FROM df")
    con.close()
    return path


def test_classify_columns_detects_varchar_dates_by_content(unclean_duckdb: Path):
    schema = inspect_table(unclean_duckdb)
    con = duckdb.connect(str(unclean_duckdb), read_only=True)
    try:
        numeric, text, dates = classify_columns(schema, con)
    finally:
        con.close()
    assert "Purchase Date" in dates
    assert "Purchase Date" not in text


def test_generate_auto_charts_finds_trend_in_unclean_data(unclean_duckdb: Path):
    schema = inspect_table(unclean_duckdb)
    charts = generate_auto_charts(unclean_duckdb, schema)
    trend_charts = [c for c in charts if c.type == "line"]
    assert len(trend_charts) == 1


def test_generate_auto_charts_handles_no_numeric_columns(tmp_path: Path):
    df = pd.DataFrame({"City": ["Chennai", "Coimbatore", "Chennai", "Madurai"] * 3})
    path = tmp_path / "no_numeric.duckdb"
    con = duckdb.connect(str(path))
    con.register("df", df)
    con.execute("CREATE TABLE data AS SELECT * FROM df")
    con.close()

    schema = inspect_table(path)
    charts = generate_auto_charts(path, schema)
    assert len(charts) >= 1
    assert all(c.value_keys == ["total"] for c in charts)
