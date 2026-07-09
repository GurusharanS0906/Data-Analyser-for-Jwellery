import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

CHUNK_SIZE = 1024 * 1024  # 1MB


def validate_extension(filename: str | None) -> str:
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided"
        )

    extension = Path(filename).suffix.lower()
    if extension not in settings.ALLOWED_UPLOAD_EXTENSIONS:
        allowed = ", ".join(sorted(settings.ALLOWED_UPLOAD_EXTENSIONS))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{extension}'. Allowed: {allowed}",
        )
    return extension


def user_upload_dir(user_id: str) -> Path:
    directory = settings.UPLOAD_DIR / user_id
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def user_processed_dir(user_id: str) -> Path:
    directory = settings.PROCESSED_DIR / user_id
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def upload_file_path(user_id: str, file_id: str, extension: str) -> Path:
    return user_upload_dir(user_id) / f"{file_id}{extension}"


def duckdb_file_path(user_id: str, file_id: str) -> Path:
    return user_processed_dir(user_id) / f"{file_id}.duckdb"


async def save_upload(user_id: str, upload: UploadFile) -> tuple[str, str, Path, int]:
    """Stream the upload to disk, enforcing the size limit as it goes.

    Returns (file_id, extension, path, size_bytes).
    """
    extension = validate_extension(upload.filename)
    file_id = uuid.uuid4().hex
    destination = upload_file_path(user_id, file_id, extension)
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    size = 0
    with open(destination, "wb") as buffer:
        while chunk := await upload.read(CHUNK_SIZE):
            size += len(chunk)
            if size > max_bytes:
                buffer.close()
                destination.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB limit",
                )
            buffer.write(chunk)

    if size == 0:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty"
        )

    return file_id, extension, destination, size


def find_uploaded_file(user_id: str, file_id: str) -> Path:
    directory = user_upload_dir(user_id)
    matches = list(directory.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Upload not found"
        )
    return matches[0]
