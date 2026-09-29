"""
Pydantic schemas package for CattleFeedAI AI Service.
"""

from app.schemas.health import HealthResponse, ServiceInfoResponse
from app.schemas.analysis import ImageMetadata, AnalysisResponse, ErrorResponse

__all__ = [
    "HealthResponse",
    "ServiceInfoResponse",
    "ImageMetadata",
    "AnalysisResponse",
    "ErrorResponse",
]
