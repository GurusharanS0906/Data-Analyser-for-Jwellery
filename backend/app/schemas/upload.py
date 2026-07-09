from typing import Any

from pydantic import BaseModel


class ColumnPreview(BaseModel):
    name: str
    dtype: str  # "number" | "text" | "date" | "currency"


class CleaningIssues(BaseModel):
    missing_values: dict[str, int]
    duplicate_rows: int
    empty_rows: int
    inconsistent_date_columns: list[str]
    inconsistent_currency_columns: list[str]

    @property
    def has_issues(self) -> bool:
        return (
            any(self.missing_values.values())
            or self.duplicate_rows > 0
            or self.empty_rows > 0
            or bool(self.inconsistent_date_columns)
            or bool(self.inconsistent_currency_columns)
        )


class UploadResponse(BaseModel):
    file_id: str
    original_name: str
    file_size_kb: int
    row_count: int
    column_count: int
    columns: list[ColumnPreview]
    rows: list[dict[str, Any]]
    issues: CleaningIssues
    has_issues: bool


class CleaningSummary(BaseModel):
    empty_rows_removed: int
    duplicate_rows_removed: int
    date_columns_normalized: list[str]
    currency_columns_normalized: list[str]
    remaining_missing_values: dict[str, int]


class CleanResponse(BaseModel):
    file_id: str
    row_count: int
    column_count: int
    columns: list[ColumnPreview]
    rows: list[dict[str, Any]]
    summary: CleaningSummary


class ConfirmUploadResponse(BaseModel):
    file_id: str
    storage_path: str
    duckdb_path: str
    row_count: int
    column_count: int
