# test_health.py — Tests mínimos para CI/CD
# pytest + httpx
import pytest
from fastapi.testclient import TestClient
import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test-secret-key"

from backend.main import app


@pytest.fixture(scope="module")
def client():
    # "with" es necesario para que se dispare el lifespan (startup) de
    # FastAPI, que es donde se ejecuta Base.metadata.create_all(). Sin
    # esto las tablas nunca se crean y cualquier test que consulte la
    # base de datos falla con "no such table".
    with TestClient(app) as c:
        yield c


def test_health_check(client):
    """Verifica que el endpoint /health responda correctamente."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data

def test_login_invalid_credentials(client):
    """Verifica rechazo de credenciales inválidas."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "noexiste@test.cl", "password": "wrongpass"},
    )
    assert response.status_code == 401

def test_alumnos_requires_auth(client):
    """Verifica que el endpoint de alumnos requiere autenticación."""
    response = client.get("/api/v1/alumnos/")
    assert response.status_code in [401, 403]
