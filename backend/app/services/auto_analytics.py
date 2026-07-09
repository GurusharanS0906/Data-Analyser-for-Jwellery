import re
from pathlib import Path

import duckdb

from app.schemas.chart import ChartSpec
from app.services.json_safe import dataframe_to_records
from app.services.schema_inspector import TableSchema

NUMERIC_TYPE_MARKERS = ["INT", "DECIMAL", "DOUBLE", "FLOAT", "REAL", "NUMERIC", "HUGEINT"]
DATE_TYPE_MARKERS = ["DATE", "TIMESTAMP"]
DATE_LIKE_PATTERN = re.compile(r"^\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}$")

MIN_GROUP_CARDINALITY = 2
MAX_GROUP_CARDINALITY = 20
TOP_N = 10


def _looks_like_date_column(con: duckdb.DuckDBPyConnection, column: str) -> bool:
    """A VARCHAR column can still hold dates — our own cleaning step formats
    them as ISO strings rather than a native DuckDB DATE type, and an
    unclean upload may have any of several string date formats. Sample a
    few values and check the shape rather than trusting the column type."""
    try:
        samples = con.execute(
            f'SELECT "{column}" FROM data WHERE "{column}" IS NOT NULL LIMIT 5'
        ).fetchall()
    except duckdb.Error:
        return False

    values = [str(row[0]) for row in samples if row[0] is not None]
    if not values:
        return False
    return sum(1 for v in values if DATE_LIKE_PATTERN.match(v)) / len(values) > 0.6


def classify_columns(
    schema: TableSchema, con: duckdb.DuckDBPyConnection | None = None
) -> tuple[list[str], list[str], list[str]]:
    """Returns (numeric_columns, text_columns, date_columns)."""
    numeric, text, dates = [], [], []
    for name, dtype in schema.columns:
        upper = dtype.upper()
        if any(marker in upper for marker in DATE_TYPE_MARKERS):
            dates.append(name)
        elif any(marker in upper for marker in NUMERIC_TYPE_MARKERS):
            numeric.append(name)
        elif con is not None and _looks_like_date_column(con, name):
            dates.append(name)
        else:
            text.append(name)
    return numeric, text, dates


def _pick_group_columns(
    con: duckdb.DuckDBPyConnection, text_columns: list[str], limit: int = 2
) -> list[str]:
    """Text columns with a sensible number of distinct values make good chart
    groupings — a "Customer Name" column (near-unique per row) or a constant
    column don't."""
    candidates: list[tuple[str, int]] = []
    for col in text_columns:
        try:
            distinct_count = con.execute(
                f'SELECT COUNT(DISTINCT "{col}") FROM data'
            ).fetchone()[0]
        except duckdb.Error:
            continue
        if MIN_GROUP_CARDINALITY <= distinct_count <= MAX_GROUP_CARDINALITY:
            candidates.append((col, distinct_count))

    candidates.sort(key=lambda pair: abs(pair[1] - 8))
    return [col for col, _count in candidates[:limit]]


def generate_auto_charts(duckdb_path: Path, schema: TableSchema) -> list[ChartSpec]:
    """Builds a handful of sensible charts directly from the schema shape —
    no LLM call. Column names vary per upload, so this is deliberately generic:
    "sum of the first numeric column, grouped by a moderate-cardinality text
    column" rather than hardcoded assumptions like "District" or "Gender"."""
    charts: list[ChartSpec] = []

    con = duckdb.connect(str(duckdb_path), read_only=True)
    try:
        numeric_cols, text_cols, date_cols = classify_columns(schema, con)
        metric_col = numeric_cols[0] if numeric_cols else None
        group_cols = _pick_group_columns(con, text_cols)

        for col in group_cols:
            if metric_col:
                sql = (
                    f'SELECT "{col}" AS category, SUM("{metric_col}") AS total '
                    f'FROM data GROUP BY "{col}" ORDER BY total DESC LIMIT {TOP_N}'
                )
                title = f"Total {metric_col} by {col}"
            else:
                sql = (
                    f'SELECT "{col}" AS category, COUNT(*) AS total '
                    f'FROM data GROUP BY "{col}" ORDER BY total DESC LIMIT {TOP_N}'
                )
                title = f"Customer count by {col}"

            rows = dataframe_to_records(con.execute(sql).fetchdf())
            if len(rows) >= MIN_GROUP_CARDINALITY:
                charts.append(
                    ChartSpec(
                        type="bar", title=title, x_key="category", value_keys=["total"], data=rows
                    )
                )

        if date_cols and metric_col:
            date_col = date_cols[0]
            sql = (
                f'SELECT strftime(TRY_CAST("{date_col}" AS DATE), \'%Y-%m\') AS month, '
                f'SUM("{metric_col}") AS total FROM data '
                f'WHERE TRY_CAST("{date_col}" AS DATE) IS NOT NULL '
                f"GROUP BY month ORDER BY month LIMIT 24"
            )
            rows = dataframe_to_records(con.execute(sql).fetchdf())
            if len(rows) >= MIN_GROUP_CARDINALITY:
                charts.append(
                    ChartSpec(
                        type="line",
                        title=f"Monthly {metric_col} trend",
                        x_key="month",
                        value_keys=["total"],
                        data=rows,
                    )
                )

        if group_cols:
            col = group_cols[0]
            sql = (
                f'SELECT "{col}" AS category, COUNT(*) AS total FROM data '
                f'GROUP BY "{col}" ORDER BY total DESC LIMIT 6'
            )
            rows = dataframe_to_records(con.execute(sql).fetchdf())
            if len(rows) >= MIN_GROUP_CARDINALITY:
                charts.append(
                    ChartSpec(
                        type="pie",
                        title=f"Customer share by {col}",
                        x_key="category",
                        value_keys=["total"],
                        data=rows,
                    )
                )
    finally:
        con.close()

    return charts
