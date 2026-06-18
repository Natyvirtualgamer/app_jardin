# Dockerfile — Backend FastAPI
# Python 3.11-slim (Debian Bookworm)
# IMPORTANTE: build context = raiz del repo (no ./backend).
# main.py y todos los modulos usan imports absolutos "from backend.xxx import yyy",
# por lo que el codigo debe quedar en /app/backend (paquete "backend"), no en /app.
FROM python:3.11-slim AS base

WORKDIR /app

# Dependencias del sistema (compilacion psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend/ /app/backend/

ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Usuario no-root (seguridad)
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
