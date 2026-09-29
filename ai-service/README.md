# CattleFeedAI - AI Service (M7.2)

A high-performance FastAPI microservice performing image validation, preprocessing, quality inspection, and deterministic visual surface screening for feed and silage samples.

---

## M7.2 Milestone Status & Scientific Boundary

**VISUAL SCREENING ACTIVE** — Implements real image preprocessing, physical image quality checks, and deterministic visual surface screening for visible mould, spoilage, and foreign material.

### Critical Scientific Boundaries:
- **Visual Screening Only:** Identifies physical surface characteristics, mould discoloration, and visible foreign material.
- **ZERO Chemical Predictions:** RGB cameras cannot measure chemical composition (protein, moisture %, crude fiber, aflatoxin, etc.).
- **ZERO Disease Diagnosis:** No veterinary disease diagnosis or clinical claims.
- **Physical Quality Checks:** Validates exposure, resolution, contrast, and data integrity.

---

## Tech Stack

- **Python:** 3.10+
- **Framework:** FastAPI (0.111+)
- **Server:** Uvicorn (0.30+)
- **Validation & Schemas:** Pydantic (v2) & Pydantic-Settings
- **Image Processing:** Pillow (PIL)
- **Testing:** Pytest, HTTPX

---

## API Endpoints

### 1. Health Check
`GET /health`
- **Auth:** None (Public)
- **Response (200 OK):**
```json
{
  "status": "UP",
  "service": "cattlefeedai-ai-service",
  "version": "0.2.0"
}
```

### 2. Service Information
`GET /api/v1/info`
- **Auth:** None (Public)
- **Response (200 OK):**
```json
{
  "service": "CattleFeedAI AI Service",
  "version": "0.2.0",
  "capabilities": {
    "image_validation": true,
    "image_preprocessing": true,
    "image_quality_assessment": true,
    "visual_screening": true,
    "chemical_prediction": false,
    "disease_diagnosis": false
  },
  "analysis_available": true
}
```

### 3. Visual Screening Analysis
`POST /api/v1/analyze/image`
- **Content-Type:** `multipart/form-data`
- **Form Param:** `file` (Binary image: JPEG, PNG, or WebP up to 10MB)
- **Response (200 OK):**
```json
{
  "analysis_available": true,
  "analysis_source": "IMAGE_VISUAL_SCREENING",
  "image_metadata": {
    "filename": "feed_sample.jpg",
    "content_type": "image/jpeg",
    "size_bytes": 45120,
    "width": 1280,
    "height": 720,
    "format": "JPEG",
    "was_resized": false
  },
  "image_quality": {
    "status": "SUFFICIENT",
    "issues": [],
    "metrics": {
      "width": 1280,
      "height": 720,
      "mean_luminance": 118.5,
      "contrast_std": 42.1
    }
  },
  "visual_indicators": [
    {
      "type": "MOULD_LIKE_APPEARANCE",
      "label": "Possible mould-like growth",
      "confidence": 0.78,
      "severity": "MEDIUM",
      "evidence": "Localized pale discolouration consistent with surface mould detected."
    }
  ],
  "overall_screening": {
    "status": "POSSIBLE_CONCERN",
    "summary": "Visual screening detected moderate surface discolouration or foreign anomalies that may warrant physical verification."
  },
  "disclaimer": "VISUAL SCREENING ONLY: Computer vision analysis identifies surface physical characteristics, mould discoloration, and visible foreign material. It does NOT measure chemical attributes like protein, moisture %, fiber, or aflatoxin, nor does it provide veterinary disease diagnosis."
}
```

---

## Running Locally

```bash
# Activate virtual environment
venv\Scripts\activate   # Windows
source venv/bin/activate # Linux/macOS

# Run tests
pytest -v

# Start FastAPI service
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Interactive API documentation: `http://localhost:8000/docs` (Swagger UI).
