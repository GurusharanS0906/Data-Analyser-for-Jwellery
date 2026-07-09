import csv
import io
from datetime import datetime, timezone
from pathlib import Path

import duckdb
import xlsxwriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.schemas.report import ReportSummary

GOLD = colors.HexColor("#D4AF37")
INK = colors.HexColor("#0a0a0a")
MUTED = colors.HexColor("#6b6b62")

MAX_DATA_ROWS = 5000  # keep exports bounded


def _pdf_safe(text: str) -> str:
    """reportlab's built-in Helvetica has no ₹ glyph (renders as a tofu box).
    The web UI and Excel keep ₹ (both UTF-8); the PDF uses the always-renderable
    'Rs.' convention standard in Indian financial documents."""
    return text.replace("₹", "Rs. ")


def _fetch_all(duckdb_path: Path) -> tuple[list[str], list[tuple]]:
    con = duckdb.connect(str(duckdb_path), read_only=True)
    try:
        result = con.execute(f"SELECT * FROM data LIMIT {MAX_DATA_ROWS}")
        columns = [d[0] for d in result.description]
        rows = result.fetchall()
        return columns, rows
    finally:
        con.close()


def build_pdf(summary: ReportSummary, duckdb_path: Path) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        title=f"Report — {summary.file_name}",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle", parent=styles["Title"], textColor=INK, fontSize=22, spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle", parent=styles["Normal"], textColor=MUTED, fontSize=10, spaceAfter=16
    )
    section_style = ParagraphStyle(
        "Section", parent=styles["Heading2"], textColor=INK, fontSize=14, spaceBefore=14, spaceAfter=8
    )
    insight_title_style = ParagraphStyle(
        "InsightTitle", parent=styles["Normal"], textColor=INK, fontSize=11, leading=14, spaceBefore=6
    )
    insight_body_style = ParagraphStyle(
        "InsightBody", parent=styles["Normal"], textColor=MUTED, fontSize=10, leading=13
    )

    generated = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
    elements = [
        Paragraph("Jewellery AI Analytics — Business Report", title_style),
        Paragraph(f"{summary.file_name} · {summary.row_count:,} records · {generated}", subtitle_style),
    ]

    # KPI table
    if summary.kpis:
        elements.append(Paragraph("Key Metrics", section_style))
        kpi_data = [
            [_pdf_safe(k.label) for k in summary.kpis],
            [_pdf_safe(k.value) for k in summary.kpis],
        ]
        kpi_table = Table(kpi_data, hAlign="LEFT")
        kpi_table.setStyle(
            TableStyle(
                [
                    ("TEXTCOLOR", (0, 0), (-1, 0), MUTED),
                    ("TEXTCOLOR", (0, 1), (-1, 1), INK),
                    ("FONTSIZE", (0, 0), (-1, 0), 9),
                    ("FONTSIZE", (0, 1), (-1, 1), 15),
                    ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
                    ("TOPPADDING", (0, 1), (-1, 1), 0),
                    ("LINEBELOW", (0, 1), (-1, 1), 0.5, GOLD),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 24),
                ]
            )
        )
        elements.append(kpi_table)

    # Insights
    elements.append(Paragraph("Smart Insights", section_style))
    for insight in summary.insights:
        elements.append(Paragraph(f"• {_pdf_safe(insight.title)}", insight_title_style))
        elements.append(Paragraph(_pdf_safe(insight.detail), insight_body_style))

    elements.append(Spacer(1, 10 * mm))

    # Data preview table (first 20 rows)
    columns, rows = _fetch_all(duckdb_path)
    preview_rows = rows[:20]
    if columns and preview_rows:
        elements.append(Paragraph("Data Preview", section_style))
        # Cap columns shown to keep the page readable
        max_cols = 6
        shown_cols = columns[:max_cols]
        table_data = [[_pdf_safe(str(c)) for c in shown_cols]] + [
            [_pdf_safe(str(v)) if v is not None else "—" for v in row[:max_cols]]
            for row in preview_rows
        ]
        data_table = Table(table_data, hAlign="LEFT", repeatRows=1)
        data_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f3f1ea")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), INK),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 7.5),
                    ("TEXTCOLOR", (0, 1), (-1, -1), INK),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e8e5da")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#faf9f5")]),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )
        elements.append(data_table)
        if len(columns) > max_cols:
            elements.append(Spacer(1, 3 * mm))
            elements.append(
                Paragraph(
                    f"Showing {max_cols} of {len(columns)} columns and 20 of "
                    f"{summary.row_count:,} rows. Full data is in the Excel/CSV export.",
                    insight_body_style,
                )
            )

    doc.build(elements)
    return buffer.getvalue()


def build_excel(summary: ReportSummary, duckdb_path: Path) -> bytes:
    buffer = io.BytesIO()
    workbook = xlsxwriter.Workbook(buffer, {"in_memory": True})

    title_fmt = workbook.add_format({"bold": True, "font_size": 16, "font_color": "#0a0a0a"})
    muted_fmt = workbook.add_format({"font_color": "#6b6b62", "font_size": 10})
    kpi_label_fmt = workbook.add_format({"font_color": "#6b6b62", "font_size": 10})
    kpi_value_fmt = workbook.add_format({"bold": True, "font_size": 14})
    section_fmt = workbook.add_format({"bold": True, "font_size": 12, "bottom": 1, "bottom_color": "#D4AF37"})
    insight_title_fmt = workbook.add_format({"bold": True, "font_size": 10})
    insight_body_fmt = workbook.add_format({"font_color": "#6b6b62", "font_size": 10, "text_wrap": True})
    header_fmt = workbook.add_format({"bold": True, "bg_color": "#f3f1ea", "border": 1, "border_color": "#e8e5da"})
    cell_fmt = workbook.add_format({"border": 1, "border_color": "#e8e5da", "font_size": 10})

    # Summary sheet
    summary_ws = workbook.add_worksheet("Summary")
    summary_ws.set_column(0, 0, 32)
    summary_ws.set_column(1, 1, 60)
    generated = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")

    summary_ws.write(0, 0, "Jewellery AI Analytics — Business Report", title_fmt)
    summary_ws.write(1, 0, f"{summary.file_name} · {summary.row_count:,} records · {generated}", muted_fmt)

    row = 3
    summary_ws.write(row, 0, "Key Metrics", section_fmt)
    row += 1
    for kpi in summary.kpis:
        summary_ws.write(row, 0, kpi.label, kpi_label_fmt)
        summary_ws.write(row, 1, kpi.value, kpi_value_fmt)
        row += 1

    row += 1
    summary_ws.write(row, 0, "Smart Insights", section_fmt)
    row += 1
    for insight in summary.insights:
        summary_ws.write(row, 0, insight.title, insight_title_fmt)
        summary_ws.write(row, 1, insight.detail, insight_body_fmt)
        row += 1

    # Data sheet
    data_ws = workbook.add_worksheet("Data")
    columns, rows = _fetch_all(duckdb_path)
    for c, col in enumerate(columns):
        data_ws.write(0, c, col, header_fmt)
        data_ws.set_column(c, c, 18)
    for r, data_row in enumerate(rows, start=1):
        for c, value in enumerate(data_row):
            data_ws.write(r, c, value if value is not None else "", cell_fmt)
    data_ws.freeze_panes(1, 0)

    workbook.close()
    return buffer.getvalue()


def build_csv(duckdb_path: Path) -> bytes:
    columns, rows = _fetch_all(duckdb_path)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(columns)
    for row in rows:
        writer.writerow(["" if v is None else v for v in row])
    return buffer.getvalue().encode("utf-8-sig")
