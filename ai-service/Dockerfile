# Minimal production container for FastAPI AI screening service
FROM python:3.10-slim

WORKDIR /app

# Prevent Python from writing .pyc and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY app ./app

# Expose default port
EXPOSE 8000

# Start Uvicorn binding to 0.0.0.0 and dynamic container $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
