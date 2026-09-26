# WageGuard India (वेतन रक्षक) — Backend Container
FROM python:3.11-slim

# Prevent Python from writing .pyc and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000 \
    ENVIRONMENT=production

WORKDIR /app

# Install curl for container health check probes
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend code, processed training data, and statutory legal corpus
COPY backend /app/backend
COPY data /app/data
COPY rag_store/corpus /app/rag_store/corpus
COPY models /app/models

# Pre-compile risk model artifact and ChromaDB vector index during container build
# (Ensures the image is self-contained without committing binary artifacts to git)
RUN python -m backend.app.ml.train && python -m backend.app.rag.ingest

# Expose default port
EXPOSE 8000

# Health check probe against /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Start FastAPI application with uvicorn, respecting dynamic $PORT from cloud platforms
CMD ["sh", "-c", "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
