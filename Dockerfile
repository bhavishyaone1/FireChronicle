# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8002

WORKDIR /app

# Install system dependencies for scientific geospatial Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code, configuration, and data
COPY backend/ ./backend/
COPY data/ ./data/

EXPOSE 8002

# Run FastAPI with uvicorn listening on the dynamically assigned PORT (for Render / Railway / Cloud Run)
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8002}"]
