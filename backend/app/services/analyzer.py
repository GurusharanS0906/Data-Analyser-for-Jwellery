import re
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.upload import CleaningIssues, ColumnPreview
from app.services.json_safe import json_safe

CURRENCY_PATTERN = re.compile(r"^[₹$€£]?\s*-?[\d,]+(\.\d+)?\s*[₹$€£]?$")
CURRENCY_SYMBOL_PATTERN = re.compile(r"[₹$€£]")
DATE_LIKE_PATTERN = re.compile(
    r"^\d{1,4}[/\-.]\d{1,2}[/\-.]\d{1,4}$"
)


def read_dataframe(path: Path) -> pd.DataFrame:
    extension = path.suffix.lower()
    try:
        if extension == ".csv":
            return pd.read_csv(path)
        if extension in (".xlsx", ".xls"):
            return pd.read_excel(path)
    except Exception as exc:  # pandas raises many different error types
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read file — it may be corrupted or not a valid "
            f"{extension} file. ({exc})",
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unsupported file type '{extension}'",
    )


def _is_currency_series(series: pd.Series) -> bool:
    values = series.dropna().astype(str).str.strip()
    if len(values) == 0:
        return False

    matches = values.str.match(CURRENCY_PATTERN)
    has_symbol_or_comma = values.str.contains(CURRENCY_SYMBOL_PATTERN) | values.str.contains(",")
    return bool(matches.mean() > 0.7 and has_symbol_or_comma.any())


def _is_date_like_series(series: pd.Series) -> bool:
    if pd.api.types.is_datetime64_any_dtype(series):
        return False

    values = series.dropna().astype(str).str.strip()
    if len(values) == 0:
        return False

    looks_date = values.str.match(DATE_LIKE_PATTERN)
    if looks_date.mean() <= 0.6:
        return False

    parsed = pd.to_datetime(values, errors="coerce", format="mixed")
    return bool(parsed.notna().mean() > 0.7)


def infer_column_type(series: pd.Series) -> str:
    if pd.api.types.is_datetime64_any_dtype(series):
        return "date"
    if pd.api.types.is_numeric_dtype(series):
        return "number"
    if _is_date_like_series(series):
        return "date"
    if _is_currency_series(series):
        return "currency"
    return "text"


def detect_issues(df: pd.DataFrame) -> CleaningIssues:
    missing_values = {col: int(df[col].isna().sum()) for col in df.columns}
    missing_values = {col: count for col, count in missing_values.items() if count > 0}

    duplicate_rows = int(df.duplicated().sum())
    empty_rows = int(df.isna().all(axis=1).sum())

    # pandas 3.0+ gives string columns a dedicated StringDtype rather than the
    # old generic `object` dtype, so check "is this text-like" instead.
    date_columns = [
        col
        for col in df.columns
        if pd.api.types.is_string_dtype(df[col]) and _is_date_like_series(df[col])
    ]
    currency_columns = [
        col
        for col in df.columns
        if pd.api.types.is_string_dtype(df[col]) and _is_currency_series(df[col])
    ]

    return CleaningIssues(
        missing_values=missing_values,
        duplicate_rows=duplicate_rows,
        empty_rows=empty_rows,
        inconsistent_date_columns=date_columns,
        inconsistent_currency_columns=currency_columns,
    )


def build_preview(
    df: pd.DataFrame, limit: int = settings.UPLOAD_PREVIEW_ROWS
) -> tuple[list[ColumnPreview], list[dict[str, Any]]]:
    columns = [
        ColumnPreview(name=str(col), dtype=infer_column_type(df[col])) for col in df.columns
    ]
    preview_df = df.head(limit)
    rows = [
        {str(col): json_safe(row[col]) for col in df.columns}
        for _, row in preview_df.iterrows()
    ]
    return columns, rows
