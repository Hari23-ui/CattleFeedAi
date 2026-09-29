"""
Configuration settings for CattleFeedAI AI Service.
Uses pydantic-settings to load configuration from environment variables.
"""

from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Service Identification
    SERVICE_NAME: str = "cattlefeedai-ai-service"
    SERVICE_TITLE: str = "CattleFeedAI AI Service"
    SERVICE_VERSION: str = "0.3.0"
    SERVICE_DESCRIPTION: str = "AI service for visual feed and silage screening with ML/CV inference architecture."

    # Server Configuration
    AI_SERVICE_HOST: str = "0.0.0.0"
    AI_SERVICE_PORT: int = 8000
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    # Image Validation Constraints
    MAX_IMAGE_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: List[str] = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ]

    # Model Configuration (M7.3 ML/CV)
    MODEL_ENABLED: bool = False
    MODEL_PATH: Optional[str] = None
    MODEL_VERSION: str = "visual-classifier-1.0"
    MODEL_NAME: str = "CattleFeed-VisualNet-Baseline"
    MODEL_CONFIDENCE_THRESHOLD: float = 0.50

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    @property
    def max_image_size_bytes(self) -> int:
        return self.MAX_IMAGE_SIZE_MB * 1024 * 1024


settings = Settings()
