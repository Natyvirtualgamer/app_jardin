# =============================================
# Sistema Gestión Preescolar — Backend FastAPI
# Python 3.11 | FastAPI 0.111 | PostgreSQL 15
# =============================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.core.database import engine, Base
from backend import models  # noqa: F401 — registra TODAS las tablas en Base.metadata
from backend.routers import auth, alumnos, apoderados, cursos, asistencia, pagos, gastos, portal, comunicaciones, minutas

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas al iniciar (solo dev; en prod usar Alembic)
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="API Jardín Infantil",
    description="Sistema de Gestión Preescolar — MVP v1.0",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(alumnos.router, prefix="/api/v1/alumnos", tags=["Alumnos"])
app.include_router(apoderados.router, prefix="/api/v1/apoderados", tags=["Apoderados"])
app.include_router(cursos.router, prefix="/api/v1/cursos", tags=["Cursos"])
app.include_router(asistencia.router, prefix="/api/v1/asistencia", tags=["Asistencia"])
app.include_router(pagos.router, prefix="/api/v1/pagos", tags=["Pagos"])
app.include_router(gastos.router, prefix="/api/v1/gastos", tags=["Gastos"])
app.include_router(portal.router, prefix="/api/v1/portal", tags=["Portal Apoderado"])
app.include_router(comunicaciones.router, prefix="/api/v1", tags=["Comunicaciones"])
app.include_router(minutas.router, prefix="/api/v1", tags=["Minutas"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "jardin-backend"}
