FROM python:3.12-slim AS base

# Set required environment variables; other defaults live in app/core/config.py
ENV ENVIRONMENT=production \
    LOG_LEVEL=info \
    CORS_ORIGINS="*"

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set work directory
WORKDIR /app

COPY pyproject.toml ./

# Install Python dependencies with cache mount
RUN --mount=type=cache,id=python-deps,target=/root/.cache/pip \
    pip install --no-cache-dir .[prod]

# Copy application code
COPY app/ ./app/

# Create necessary directories and set permissions
RUN mkdir -p audio keys data && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Default command - use Gunicorn with Uvicorn workers for production
CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-"]
