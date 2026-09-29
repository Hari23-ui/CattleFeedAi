"""
Health and service info routers for CattleFeedAI AI Service.
"""

from fastapi import APIRouter
from app.config import settings
from app.schemas.health import HealthResponse, ServiceInfoResponse, ServiceCapabilities, ModelInfoSchema
from app.services.ml_inference_service import ml_inference_service

router = APIRouter(tags=["Health & Service Info"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service Health Check",
    description="Returns the operational status of the AI microservice.",
)
async def health_check() -> HealthResponse:
    """Public health check endpoint for container orchestrators and upstream services."""
    return HealthResponse(
        status="UP",
        service=settings.SERVICE_NAME,
        version=settings.SERVICE_VERSION,
    )


@router.get(
    "/api/v1/info",
    response_model=ServiceInfoResponse,
    summary="AI Service Information",
    description="Returns service capabilities, ML/CV model readiness, and visual screening status.",
)
async def service_info() -> ServiceInfoResponse:
    """
    Returns AI service capabilities and model status.
    In M7.3: visual_screening and analysis_available are TRUE.
    ml_visual_screening is TRUE only if an ML model is loaded and ready.
    Chemical predictions and disease diagnosis strictly remain FALSE.
    """
    model_info = ml_inference_service.get_model_info()
    model_available = model_info.get("available", False)

    return ServiceInfoResponse(
        service=settings.SERVICE_TITLE,
        version=settings.SERVICE_VERSION,
        capabilities=ServiceCapabilities(
            ml_visual_screening=model_available,
        ),
        analysis_available=True,
        model=ModelInfoSchema(
            available=model_available,
            version=model_info.get("version"),
            name=model_info.get("name"),
        ),
    )
