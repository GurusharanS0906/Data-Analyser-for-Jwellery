from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.security import get_current_user_id
from app.schemas.chart import ChartSpec
from app.services import storage
from app.services.auto_analytics import generate_auto_charts
from app.services.schema_inspector import inspect_table

router = APIRouter()


class AutoAnalyticsResponse(BaseModel):
    charts: list[ChartSpec]
    row_count: int
    column_count: int


@router.get(
    "/{file_id}",
    response_model=AutoAnalyticsResponse,
    summary="Auto-generated charts for an uploaded file",
)
async def get_auto_analytics(
    file_id: str,
    user_id: str = Depends(get_current_user_id),
) -> AutoAnalyticsResponse:
    duckdb_path = storage.duckdb_file_path(user_id, file_id)
    schema = inspect_table(duckdb_path)
    charts = generate_auto_charts(duckdb_path, schema)

    return AutoAnalyticsResponse(
        charts=charts, row_count=schema.row_count, column_count=len(schema.columns)
    )
