from app.services.chart_engine import build_chart_spec, detect_requested_chart_type
from app.services.sql_engine import QueryResult


def make_result(columns, rows) -> QueryResult:
    return QueryResult(sql="SELECT 1", columns=columns, rows=rows)


def test_detect_requested_chart_type_pie():
    assert detect_requested_chart_type("Show this as a pie chart") == "pie"


def test_detect_requested_chart_type_none():
    assert detect_requested_chart_type("How many customers do I have?") is None


def test_no_chart_for_single_row():
    result = make_result(["total"], [{"total": 42}])
    assert build_chart_spec("How many customers?", result) is None


def test_no_chart_for_non_numeric_result():
    result = make_result(
        ["city"], [{"city": "Chennai"}, {"city": "Coimbatore"}]
    )
    assert build_chart_spec("List the cities", result) is None


def test_category_and_metric_defaults_to_pie_for_small_row_count():
    rows = [
        {"city": "Chennai", "revenue": 90000},
        {"city": "Coimbatore", "revenue": 120000},
        {"city": "Madurai", "revenue": 45000},
    ]
    result = make_result(["city", "revenue"], rows)
    spec = build_chart_spec("Which district has the highest revenue?", result)
    assert spec is not None
    assert spec.type == "pie"
    assert spec.x_key == "city"
    assert spec.value_keys == ["revenue"]


def test_category_and_metric_defaults_to_bar_for_larger_row_count():
    rows = [{"city": f"City{i}", "revenue": i * 1000} for i in range(10)]
    result = make_result(["city", "revenue"], rows)
    spec = build_chart_spec("Show revenue by city", result)
    assert spec is not None
    assert spec.type == "bar"


def test_explicit_bar_chart_request_overrides_default():
    rows = [
        {"city": "Chennai", "revenue": 90000},
        {"city": "Coimbatore", "revenue": 120000},
    ]
    result = make_result(["city", "revenue"], rows)
    spec = build_chart_spec("Show me a bar chart of revenue by city", result)
    assert spec.type == "bar"


def test_pie_request_with_too_many_rows_falls_back_to_bar():
    rows = [{"city": f"City{i}", "revenue": i} for i in range(12)]
    result = make_result(["city", "revenue"], rows)
    spec = build_chart_spec("pie chart of revenue by city", result)
    assert spec.type == "bar"


def test_date_column_produces_line_chart():
    rows = [
        {"month": "2024-01-01", "revenue": 10000},
        {"month": "2024-02-01", "revenue": 15000},
        {"month": "2024-03-01", "revenue": 12000},
    ]
    result = make_result(["month", "revenue"], rows)
    spec = build_chart_spec("Show the monthly trend", result)
    assert spec.type == "line"
    assert spec.x_key == "month"


def test_two_categorical_dimensions_produce_heatmap():
    rows = [
        {"city": "Chennai", "product": "Ring", "total": 5},
        {"city": "Chennai", "product": "Chain", "total": 3},
        {"city": "Coimbatore", "product": "Ring", "total": 8},
    ]
    result = make_result(["city", "product", "total"], rows)
    spec = build_chart_spec("Visualize this as a heatmap", result)
    assert spec.type == "heatmap"
    assert spec.x_key == "city"
    assert spec.y_key == "product"


def test_too_many_rows_skips_chart():
    rows = [{"city": f"City{i}", "revenue": i} for i in range(60)]
    result = make_result(["city", "revenue"], rows)
    assert build_chart_spec("Show revenue by city", result) is None
