from typing import Literal

from pydantic import BaseModel

InsightTone = Literal["positive", "neutral", "attention"]


class Insight(BaseModel):
    title: str
    detail: str
    tone: InsightTone


class KpiItem(BaseModel):
    label: str
    value: str


class ReportSummary(BaseModel):
    file_id: str
    file_name: str
    row_count: int
    column_count: int
    kpis: list[KpiItem]
    insights: list[Insight]


ReportFormat = Literal["pdf", "excel", "csv"]
