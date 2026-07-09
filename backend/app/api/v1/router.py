from fastapi import APIRouter

from app.api.v1.endpoints import analytics, chat, health, reports, uploads

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
