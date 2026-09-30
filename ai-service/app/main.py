"""
CattleFeedAI - AI Service Foundation (M7.1)

FastAPI microservice establishing the service foundation and API contract
for computer-vision visual feed and silage quality screening.

IMPORTANT SCIENTIFIC BOUNDARY:
- VISUAL SCREENING ONLY.
- ZERO computer vision inference in M7.1.
- ZERO ML prediction.
- ZERO chemical parameter prediction (protein, moisture %, fiber, aflatoxin, etc.).
- ZERO disease diagnosis.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.routers.health import router as health_router
from app.routers.analysis import router as analysis_router
from app.utils.image_validation import ImageValidationError

# Configure safe logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("cattlefeedai-ai-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan managing startup and shutdown routines."""
    logger.info(
        "Starting %s v%s in %s mode (Host: %s, Port: %d)",
        settings.SERVICE_TITLE,
        settings.SERVICE_VERSION,
        settings.APP_ENV,
        settings.AI_SERVICE_HOST,
        settings.effective_port,
    )
    logger.info("Allowed image types: %s", ", ".join(settings.ALLOWED_IMAGE_TYPES))
    logger.info("Maximum image size: %d MB", settings.MAX_IMAGE_SIZE_MB)
    yield
    logger.info("Shutting down %s", settings.SERVICE_TITLE)


app = FastAPI(
    title=settings.SERVICE_TITLE,
    version=settings.SERVICE_VERSION,
    description=settings.SERVICE_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers
@app.exception_handler(ImageValidationError)
async def image_validation_exception_handler(request: Request, exc: ImageValidationError):
    """Handle custom image validation errors without leaking sensitive data."""
    logger.warning("Image validation failed on %s: %s (status %d)", request.url.path, exc.message, exc.status_code)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "ImageValidationError",
            "message": exc.message,
            "detail": exc.detail,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle FastAPI request validation errors."""
    logger.warning("Request validation error on %s: %s", request.url.path, exc.errors())
    return JSONResponse(
        status_code=422,
        content={
            "error": "ValidationError",
            "message": "Invalid request parameters or payload structure.",
            "detail": [
                {
                    "loc": err.get("loc"),
                    "msg": err.get("msg"),
                    "type": err.get("type"),
                }
                for err in exc.errors()
            ],
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle standard HTTP exceptions."""
    logger.debug("HTTP exception on %s: %d - %s", request.url.path, exc.status_code, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTPException",
            "message": str(exc.detail),
            "detail": None,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all handler preventing any internal stack trace or path disclosure."""
    logger.error("Unhandled internal error processing %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing the request.",
            "detail": None,
        },
    )


# Register Routers
app.include_router(health_router)
app.include_router(analysis_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.AI_SERVICE_HOST, port=settings.effective_port, reload=False)
