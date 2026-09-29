"""
Analysis endpoints for CattleFeedAI AI Service (M7.2).
Provides real image-based visual screening pipeline for feed and silage samples.
"""

from fastapi import APIRouter, File, UploadFile, status

from app.schemas.analysis import VisualAnalysisResponse, ErrorResponse
from app.services.image_service import image_service

router = APIRouter(prefix="/api/v1", tags=["Image Analysis"])


@router.post(
    "/analyze/image",
    response_model=VisualAnalysisResponse,
    status_code=status.HTTP_200_OK,
    responses={
        200: {
            "model": VisualAnalysisResponse,
            "description": "Visual screening completed successfully.",
        },
        400: {"model": ErrorResponse, "description": "Invalid or corrupt image data."},
        413: {"model": ErrorResponse, "description": "Image exceeds maximum allowed size."},
        415: {"model": ErrorResponse, "description": "Unsupported image format or MIME type."},
    },
    summary="Screen Feed / Silage Image (Visual Inspection)",
    description=(
        "Executes the M7.2 visual analysis pipeline: preprocessing, quality assessment, "
        "and physical surface screening for apparent mould, spoilage, or foreign material. "
        "Does NOT measure chemical attributes (protein, moisture %, etc.) or diagnose animal diseases."
    ),
)
async def analyze_image(
    file: UploadFile = File(..., description="Feed or silage sample image file (JPEG, PNG, WebP)"),
) -> VisualAnalysisResponse:
    """
    Analyzes an uploaded sample image and returns structured visual indicators.
    """
    return await image_service.analyze_image_upload(file)
