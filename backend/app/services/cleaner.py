import pandas as pd

from app.schemas.upload import CleaningIssues, CleaningSummary


def clean_dataframe(
    df: pd.DataFrame, issues: CleaningIssues
) -> tuple[pd.DataFrame, CleaningSummary]:
    working = df.copy()

    empty_rows_removed = int(working.isna().all(axis=1).sum())
    working = working.dropna(how="all")

    duplicate_rows_removed = int(working.duplicated().sum())
    working = working.drop_duplicates()

    date_columns_normalized: list[str] = []
    for col in issues.inconsistent_date_columns:
        if col not in working.columns:
            continue
        parsed = pd.to_datetime(working[col], errors="coerce", format="mixed")
        working[col] = parsed.dt.strftime("%Y-%m-%d")
        date_columns_normalized.append(col)

    currency_columns_normalized: list[str] = []
    for col in issues.inconsistent_currency_columns:
        if col not in working.columns:
            continue
        cleaned = (
            working[col]
            .astype(str)
            .str.replace(r"[₹$€£,\s]", "", regex=True)
        )
        working[col] = pd.to_numeric(cleaned, errors="coerce")
        currency_columns_normalized.append(col)

    remaining_missing = {
        col: int(count) for col, count in working.isna().sum().items() if count > 0
    }

    summary = CleaningSummary(
        empty_rows_removed=empty_rows_removed,
        duplicate_rows_removed=duplicate_rows_removed,
        date_columns_normalized=date_columns_normalized,
        currency_columns_normalized=currency_columns_normalized,
        remaining_missing_values=remaining_missing,
    )

    return working.reset_index(drop=True), summary
