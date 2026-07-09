import numpy as np
import pandas as pd

from app.services.analyzer import build_preview, detect_issues, infer_column_type
from app.services.cleaner import clean_dataframe


def make_sample_df() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "Name": ["Priya", "Arun", "Lakshmi", "Priya", np.nan],
            "Amount": ["₹1,200", "500", "$300.50", "₹1,200", np.nan],
            "PurchaseDate": ["12/01/2024", "2024-03-15", "05/20/2024", "12/01/2024", np.nan],
            "City": ["Chennai", "Coimbatore", np.nan, "Chennai", np.nan],
        }
    )


def test_infer_column_type_number():
    series = pd.Series([1, 2, 3])
    assert infer_column_type(series) == "number"


def test_infer_column_type_text():
    series = pd.Series(["a", "b", "c"])
    assert infer_column_type(series) == "text"


def test_detect_issues_finds_missing_values():
    df = make_sample_df()
    issues = detect_issues(df)
    assert issues.missing_values["Name"] == 1
    assert issues.missing_values["City"] == 2


def test_detect_issues_finds_duplicate_rows():
    df = make_sample_df()
    issues = detect_issues(df)
    assert issues.duplicate_rows == 1


def test_detect_issues_finds_currency_column():
    df = make_sample_df()
    issues = detect_issues(df)
    assert "Amount" in issues.inconsistent_currency_columns


def test_detect_issues_finds_date_column():
    df = make_sample_df()
    issues = detect_issues(df)
    assert "PurchaseDate" in issues.inconsistent_date_columns


def test_has_issues_true_when_problems_found():
    df = make_sample_df()
    issues = detect_issues(df)
    assert issues.has_issues is True


def test_clean_dataframe_removes_duplicates_and_normalizes():
    df = make_sample_df()
    issues = detect_issues(df)
    cleaned, summary = clean_dataframe(df, issues)

    assert summary.duplicate_rows_removed == 1
    assert "Amount" in summary.currency_columns_normalized
    assert "PurchaseDate" in summary.date_columns_normalized
    assert pd.api.types.is_numeric_dtype(cleaned["Amount"])
    # Currency strings should be parsed to their numeric values
    assert cleaned.loc[cleaned["Name"] == "Priya", "Amount"].iloc[0] == 1200


def test_clean_dataframe_drops_fully_empty_rows():
    df = pd.DataFrame({"A": [1, np.nan, 3], "B": [np.nan, np.nan, 3]})
    issues = detect_issues(df)
    cleaned, summary = clean_dataframe(df, issues)
    assert summary.empty_rows_removed == 1
    assert len(cleaned) == 2


def test_build_preview_returns_json_safe_values():
    df = make_sample_df()
    columns, rows = build_preview(df, limit=10)
    assert len(columns) == 4
    assert len(rows) == 5
    # NaN should be converted to None, not left as float('nan')
    missing_city_row = next(r for r in rows if r["Name"] == "Lakshmi")
    assert missing_city_row["City"] is None
