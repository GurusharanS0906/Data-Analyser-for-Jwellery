from fastapi import APIRouter

from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("", response_model=HealthResponse, summary="Health check")
async def health_check() -> HealthResponse:
    """Lightweight liveness/readiness probe used by load balancers and uptime monitors."""
    return HealthResponse(
        status="ok",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
    )
