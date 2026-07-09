from typing import Any

import numpy as np
import pandas as pd


def json_safe(value: Any) -> Any:
    """Convert a pandas/numpy scalar into something the JSON encoder can handle."""
    if value is None:
        return None
    if isinstance(value, (pd.Timestamp,)):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return None if np.isnan(value) else float(value)
    if isinstance(value, float) and np.isnan(value):
        return None
    if pd.isna(value):
        return None
    return value


def dataframe_to_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    return [
        {str(col): json_safe(row[col]) for col in df.columns} for _, row in df.iterrows()
    ]
