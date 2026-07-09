from typing import Any, Literal

from pydantic import BaseModel

ChartType = Literal["bar", "pie", "donut", "line", "area", "heatmap"]


class ChartSpec(BaseModel):
    type: ChartType
    title: str
    x_key: str
    y_key: str | None = None  # second dimension, heatmap only
    value_keys: list[str]
    data: list[dict[str, Any]]
