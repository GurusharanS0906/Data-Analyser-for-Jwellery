from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response

from app.core.security import get_current_user_id
from app.schemas.report import ReportFormat, ReportSummary
from app.services import storage
from app.services.insights_engine import build_report_summary
from app.services.report_builder import build_csv, build_excel, build_pdf
from app.services.schema_inspector import inspect_table
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

MEDIA_TYPES = {
    "pdf": "application/pdf",
    "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "csv": "text/csv",
}
EXTENSIONS = {"pdf": "pdf", "excel": "xlsx", "csv": "csv"}


@router.get(
    "/{file_id}/summary",
    response_model=ReportSummary,
    summary="KPIs + smart insights for an uploaded file",
)
async def get_report_summary(
    file_id: str,
    file_name: str = Query(default="report"),
    user_id: str = Depends(get_current_user_id),
) -> ReportSummary:
    duckdb_path = storage.duckdb_file_path(user_id, file_id)
    schema = inspect_table(duckdb_path)
    return build_report_summary(duckdb_path, schema, file_id, file_name)


@router.get("/{file_id}/download", summary="Download a report as PDF, Excel, or CSV")
async def download_report(
    file_id: str,
    report_format: ReportFormat = Query(alias="format", default="pdf"),
    file_name: str = Query(default="report"),
    user_id: str = Depends(get_current_user_id),
) -> Response:
    duckdb_path = storage.duckdb_file_path(user_id, file_id)
    schema = inspect_table(duckdb_path)

    if report_format == "csv":
        content = build_csv(duckdb_path)
    else:
        summary = build_report_summary(duckdb_path, schema, file_id, file_name)
        content = (
            build_pdf(summary, duckdb_path)
            if report_format == "pdf"
            else build_excel(summary, duckdb_path)
        )

    if not content:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate the report.",
        )

    safe_name = "".join(c for c in file_name if c.isalnum() or c in (" ", "-", "_")).strip()
    safe_name = safe_name or "report"
    download_name = f"{safe_name}.{EXTENSIONS[report_format]}"

    logger.info("Generated %s report for user %s (%s)", report_format, user_id, file_id)

    return Response(
        content=content,
        media_type=MEDIA_TYPES[report_format],
        headers={"Content-Disposition": f'attachment; filename="{download_name}"'},
    )
