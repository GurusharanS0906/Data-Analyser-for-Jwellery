import re
from datetime import date, datetime

from app.schemas.chart import ChartSpec, ChartType
from app.services.sql_engine import QueryResult

CHART_TYPE_KEYWORDS: dict[ChartType, list[str]] = {
    "pie": ["pie chart", "pie graph", "as a pie"],
    "donut": ["donut chart", "doughnut chart", "donut graph"],
    "heatmap": ["heatmap", "heat map"],
    "line": ["line chart", "line graph", "trend line"],
    "area": ["area chart", "area graph"],
    "bar": ["bar chart", "bar graph", "as a bar"],
}

GENERIC_CHART_TRIGGERS = ["chart", "graph", "visuali", "plot"]

MIN_CHART_ROWS = 2
MAX_CHART_ROWS = 50


def wants_any_chart(question: str) -> bool:
    q = question.lower()
    return any(kw in q for kw in GENERIC_CHART_TRIGGERS)


def detect_requested_chart_type(question: str) -> ChartType | None:
    q = question.lower()
    for chart_type, keywords in CHART_TYPE_KEYWORDS.items():
        if any(kw in q for kw in keywords):
            return chart_type
    return None


def _is_numeric(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _is_date_like(value: object) -> bool:
    if isinstance(value, (date, datetime)):
        return True
    if isinstance(value, str):
        return bool(re.match(r"^\d{4}-\d{2}-\d{2}", value))
    return False


def _title_from_question(question: str) -> str:
    title = question.strip().rstrip("?").strip()
    return title[0].upper() + title[1:] if title else "Result"


def build_chart_spec(question: str, result: QueryResult) -> ChartSpec | None:
    """Pure heuristic — no LLM call. Column shapes are already known objectively
    from the query result, so classifying "is this chartable, and how" is a
    deterministic decision, not one worth spending a model call on."""

    row_count = len(result.rows)
    if row_count < MIN_CHART_ROWS or row_count > MAX_CHART_ROWS:
        return None

    sample = result.rows[0]
    numeric_cols = [c for c in result.columns if _is_numeric(sample.get(c))]
    if not numeric_cols:
        return None

    other_cols = [c for c in result.columns if c not in numeric_cols]
    date_cols = [c for c in other_cols if _is_date_like(sample.get(c))]
    category_cols = [c for c in other_cols if c not in date_cols]

    requested = detect_requested_chart_type(question)
    title = _title_from_question(question)

    # Two categorical dimensions + a metric -> cross-tab, best shown as a heatmap.
    if len(category_cols) >= 2 and not date_cols:
        chart_type: ChartType = requested if requested else "heatmap"
        return ChartSpec(
            type=chart_type,
            title=title,
            x_key=category_cols[0],
            y_key=category_cols[1],
            value_keys=[numeric_cols[0]],
            data=result.rows,
        )

    # A date-like column -> trend over time.
    if date_cols:
        chart_type = requested if requested in ("line", "area", "bar") else "line"
        return ChartSpec(
            type=chart_type,
            title=title,
            x_key=date_cols[0],
            value_keys=numeric_cols[:3],
            data=result.rows,
        )

    # One category + one or more metrics -> bar/pie/donut.
    if len(category_cols) == 1:
        chart_type = requested
        if not chart_type:
            chart_type = "pie" if row_count <= 6 and len(numeric_cols) == 1 else "bar"
        elif chart_type in ("pie", "donut") and (row_count > 8 or len(numeric_cols) > 1):
            chart_type = "bar"  # too many slices or multiple metrics — pie can't show it

        value_keys = numeric_cols[:1] if chart_type in ("pie", "donut") else numeric_cols[:4]
        return ChartSpec(
            type=chart_type,
            title=title,
            x_key=category_cols[0],
            value_keys=value_keys,
            data=result.rows,
        )

    return None
