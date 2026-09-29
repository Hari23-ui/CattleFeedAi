"""
Pydantic schemas for health and service discovery endpoints.
"""

from typing import Union, List, Dict, Optional, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., description="Service health status", json_schema_extra={"example": "UP"})
    service: str = Field(..., description="Microservice identifier", json_schema_extra={"example": "cattlefeedai-ai-service"})
    version: str = Field(..., description="Service semantic version", json_schema_extra={"example": "0.3.0"})


class ServiceCapabilities(BaseModel):
    image_validation: bool = Field(True, description="Byte and format validation supported")
    image_preprocessing: bool = Field(True, description="RGB and dimension normalization supported")
    image_quality_assessment: bool = Field(True, description="Exposure and resolution quality checks supported")
    visual_screening: bool = Field(True, description="Surface visual screening active in M7.2/M7.3")
    ml_visual_screening: bool = Field(False, description="ML/CV model-based visual screening active")
    chemical_prediction: bool = Field(False, description="Chemical parameters (protein, moisture) NOT supported")
    disease_diagnosis: bool = Field(False, description="Disease diagnosis NOT supported")


class ModelInfoSchema(BaseModel):
    available: bool = Field(False, description="Whether an ML model is loaded and ready for inference")
    version: Optional[str] = Field(None, description="Active model version if available")
    name: Optional[str] = Field(None, description="Model identifier / architecture name")


class ServiceInfoResponse(BaseModel):
    service: str = Field(..., description="Human-readable service title", json_schema_extra={"example": "CattleFeedAI AI Service"})
    version: str = Field(..., description="Service version", json_schema_extra={"example": "0.3.0"})
    capabilities: Union[ServiceCapabilities, List[str], Dict[str, Any]] = Field(..., description="Map or list of capabilities")
    analysis_available: bool = Field(..., description="Whether visual screening analysis is active")
    model: Optional[ModelInfoSchema] = Field(None, description="ML model status and version info")
