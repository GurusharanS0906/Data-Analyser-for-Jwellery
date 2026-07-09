from pathlib import Path

import duckdb

from app.schemas.report import Insight, KpiItem, ReportSummary
from app.services.auto_analytics import classify_columns
from app.services.schema_inspector import TableSchema

# Column-name hints that suggest a "money" metric, checked in priority order.
MONEY_HINTS = ["amount", "revenue", "price", "value", "total", "sales", "spend", "purchase"]


def _format_inr(value: float) -> str:
    """Compact Indian-style currency: ₹1.24 Cr / ₹4.5 L / ₹32,000."""
    if value >= 1_00_00_000:
        return f"₹{value / 1_00_00_000:.2f} Cr"
    if value >= 1_00_000:
        return f"₹{value / 1_00_000:.2f} L"
    return f"₹{value:,.0f}"


def _format_count(value: float) -> str:
    return f"{int(value):,}"


def _pick_money_metric(numeric_cols: list[str]) -> str | None:
    for hint in MONEY_HINTS:
        for col in numeric_cols:
            if hint in col.lower():
                return col
    return numeric_cols[0] if numeric_cols else None


def _pick_group_columns(
    con: duckdb.DuckDBPyConnection, text_cols: list[str], limit: int = 3
) -> list[str]:
    candidates: list[tuple[str, int]] = []
    for col in text_cols:
        try:
            distinct = con.execute(f'SELECT COUNT(DISTINCT "{col}") FROM data').fetchone()[0]
        except duckdb.Error:
            continue
        if 2 <= distinct <= 20:
            candidates.append((col, distinct))
    candidates.sort(key=lambda pair: abs(pair[1] - 8))
    return [col for col, _ in candidates[:limit]]


def build_report_summary(
    duckdb_path: Path, schema: TableSchema, file_id: str, file_name: str
) -> ReportSummary:
    """Computes KPIs and business insights entirely in DuckDB — real aggregates,
    no LLM call. Column names vary per upload, so everything is derived generically
    (a name-hinted 'money' column grouped by moderate-cardinality text columns)."""
    con = duckdb.connect(str(duckdb_path), read_only=True)
    try:
        numeric_cols, text_cols, date_cols = classify_columns(schema, con)
        metric = _pick_money_metric(numeric_cols)
        group_cols = _pick_group_columns(con, text_cols)

        kpis: list[KpiItem] = [KpiItem(label="Total Records", value=_format_count(schema.row_count))]
        insights: list[Insight] = []

        if metric:
            total, avg = con.execute(
                f'SELECT SUM("{metric}"), AVG("{metric}") FROM data'
            ).fetchone()
            if total is not None:
                kpis.append(KpiItem(label=f"Total {metric}", value=_format_inr(total)))
            if avg is not None:
                kpis.append(KpiItem(label=f"Average {metric}", value=_format_inr(avg)))

        # Top group + its revenue share
        if metric and group_cols:
            for col in group_cols:
                rows = con.execute(
                    f'SELECT "{col}" AS g, SUM("{metric}") AS total FROM data '
                    f'WHERE "{col}" IS NOT NULL GROUP BY g ORDER BY total DESC'
                ).fetchall()
                if len(rows) < 2:
                    continue
                top_name, top_total = rows[0]
                grand_total = sum(r[1] for r in rows if r[1] is not None) or 1
                share = top_total / grand_total * 100
                insights.append(
                    Insight(
                        title=f"{top_name} leads by {col}",
                        detail=(
                            f"{top_name} contributes {_format_inr(top_total)} "
                            f"({share:.0f}% of total {metric}) — the highest of any {col}."
                        ),
                        tone="positive",
                    )
                )
                # Low performer
                bottom_name, bottom_total = rows[-1]
                insights.append(
                    Insight(
                        title=f"{bottom_name} is the lowest {col}",
                        detail=(
                            f"{bottom_name} brings in only {_format_inr(bottom_total or 0)} "
                            f"— consider a targeted promotion."
                        ),
                        tone="attention",
                    )
                )

        # Best cross-tab pairing (e.g. "Gold Bangles sells best in Coimbatore")
        if metric and len(group_cols) >= 2:
            a, b = group_cols[0], group_cols[1]
            row = con.execute(
                f'SELECT "{a}" AS ga, "{b}" AS gb, SUM("{metric}") AS total FROM data '
                f'WHERE "{a}" IS NOT NULL AND "{b}" IS NOT NULL '
                f"GROUP BY ga, gb ORDER BY total DESC LIMIT 1"
            ).fetchone()
            if row:
                insights.append(
                    Insight(
                        title=f"Best {a}–{b} pairing",
                        detail=(
                            f"{row[0]} performs best in {row[1]}, generating "
                            f"{_format_inr(row[2])}."
                        ),
                        tone="positive",
                    )
                )

        # Month-over-month trend
        if metric and date_cols:
            date_col = date_cols[0]
            trend = con.execute(
                f"SELECT strftime(TRY_CAST(\"{date_col}\" AS DATE), '%Y-%m') AS m, "
                f'SUM("{metric}") AS total FROM data '
                f'WHERE TRY_CAST("{date_col}" AS DATE) IS NOT NULL '
                f"GROUP BY m ORDER BY m"
            ).fetchall()
            if len(trend) >= 2:
                prev_total = trend[-2][1] or 0
                last_total = trend[-1][1] or 0
                if prev_total > 0:
                    change = (last_total - prev_total) / prev_total * 100
                    tone = "positive" if change >= 0 else "attention"
                    direction = "increased" if change >= 0 else "dropped"
                    insights.append(
                        Insight(
                            title=f"Month-over-month {metric} {direction}",
                            detail=(
                                f"{metric} {direction} {abs(change):.0f}% from {trend[-2][0]} "
                                f"({_format_inr(prev_total)}) to {trend[-1][0]} "
                                f"({_format_inr(last_total)})."
                            ),
                            tone=tone,
                        )
                    )

                # Next-month forecast: project last month forward by the average
                # month-over-month growth of the most recent months. A deliberately
                # simple, clearly-labelled estimate — not a statistical model.
                totals = [t[1] or 0 for t in trend]
                recent = totals[-4:]
                growths = [
                    (recent[i] - recent[i - 1]) / recent[i - 1]
                    for i in range(1, len(recent))
                    if recent[i - 1] > 0
                ]
                if growths:
                    avg_growth = sum(growths) / len(growths)
                    projected = max(0, totals[-1] * (1 + avg_growth))
                    insights.append(
                        Insight(
                            title=f"Projected next-month {metric}",
                            detail=(
                                f"Based on recent momentum, next month's {metric} is "
                                f"estimated at ~{_format_inr(projected)} "
                                f"({avg_growth * 100:+.0f}% vs {trend[-1][0]}). "
                                f"A rough projection from recent trend, not a guarantee."
                            ),
                            tone="neutral",
                        )
                    )

        if not insights:
            insights.append(
                Insight(
                    title="Not enough structure for deep insights",
                    detail=(
                        "This file doesn't have a clear money column and category "
                        "columns to break down. Try AI Chat for specific questions."
                    ),
                    tone="neutral",
                )
            )

        return ReportSummary(
            file_id=file_id,
            file_name=file_name,
            row_count=schema.row_count,
            column_count=len(schema.columns),
            kpis=kpis,
            insights=insights,
        )
    finally:
        con.close()
