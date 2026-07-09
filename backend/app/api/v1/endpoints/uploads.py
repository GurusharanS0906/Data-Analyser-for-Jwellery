import duckdb
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.core.security import get_current_user_id
from app.schemas.upload import CleanResponse, ConfirmUploadResponse, UploadResponse
from app.services import storage
from app.services.analyzer import build_preview, detect_issues, read_dataframe
from app.services.cleaner import clean_dataframe
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post("", response_model=UploadResponse, summary="Upload and analyze a file")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
) -> UploadResponse:
    file_id, _extension, path, size_bytes = await storage.save_upload(user_id, file)

    df = read_dataframe(path)
    issues = detect_issues(df)
    columns, rows = build_preview(df)

    logger.info(
        "Analyzed upload %s for user %s: %s rows, %s cols, issues=%s",
        file_id,
        user_id,
        len(df),
        len(df.columns),
        issues.has_issues,
    )

    return UploadResponse(
        file_id=file_id,
        original_name=file.filename or "upload",
        file_size_kb=max(1, size_bytes // 1024),
        row_count=len(df),
        column_count=len(df.columns),
        columns=columns,
        rows=rows,
        issues=issues,
        has_issues=issues.has_issues,
    )


@router.post(
    "/{file_id}/clean",
    response_model=CleanResponse,
    summary="Preview the result of automatic data cleaning",
)
async def clean_file(
    file_id: str,
    user_id: str = Depends(get_current_user_id),
) -> CleanResponse:
    path = storage.find_uploaded_file(user_id, file_id)
    df = read_dataframe(path)
    issues = detect_issues(df)

    cleaned_df, summary = clean_dataframe(df, issues)
    columns, rows = build_preview(cleaned_df)

    return CleanResponse(
        file_id=file_id,
        row_count=len(cleaned_df),
        column_count=len(cleaned_df.columns),
        columns=columns,
        rows=rows,
        summary=summary,
    )


class ConfirmUploadRequest(BaseModel):
    apply_cleaning: bool = False


@router.post(
    "/{file_id}/confirm",
    response_model=ConfirmUploadResponse,
    summary="Finalize the upload into a queryable DuckDB file",
)
async def confirm_upload(
    file_id: str,
    body: ConfirmUploadRequest,
    user_id: str = Depends(get_current_user_id),
) -> ConfirmUploadResponse:
    path = storage.find_uploaded_file(user_id, file_id)
    df = read_dataframe(path)

    if body.apply_cleaning:
        issues = detect_issues(df)
        df, _summary = clean_dataframe(df, issues)

    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No rows remain after cleaning — nothing to save.",
        )

    duckdb_path = storage.duckdb_file_path(user_id, file_id)
    con = duckdb.connect(str(duckdb_path))
    try:
        con.register("upload_df", df)
        con.execute("CREATE OR REPLACE TABLE data AS SELECT * FROM upload_df")
        con.unregister("upload_df")
    finally:
        con.close()

    logger.info(
        "Confirmed upload %s for user %s -> %s (%s rows)",
        file_id,
        user_id,
        duckdb_path,
        len(df),
    )

    return ConfirmUploadResponse(
        file_id=file_id,
        storage_path=str(path),
        duckdb_path=str(duckdb_path),
        row_count=len(df),
        column_count=len(df.columns),
    )
