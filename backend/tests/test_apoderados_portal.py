import os
from datetime import date
from decimal import Decimal
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test-secret-key"

from backend.core.database import SessionLocal
from backend.core.deps import get_current_user
from backend.main import app
from backend.models.alumno import Alumno, AlumnoApoderado, Apoderado
from backend.models.asistencia import Asistencia
from backend.models.curso import Curso
from backend.models.institucion import Institucion
from backend.models.pago import Mensualidad, Pago


def _usuario(rol: str, email: str = "admin@test.cl", rut: str = "11111111-1"):
    return SimpleNamespace(
        id_usuario=1,
        email=email,
        rut=rut,
        rol=SimpleNamespace(nombre=rol),
    )


def _limpiar_db():
    db = SessionLocal()
    try:
        for modelo in [Pago, Mensualidad, Asistencia, AlumnoApoderado, Alumno, Curso, Apoderado, Institucion]:
            db.query(modelo).delete()
        db.commit()
    finally:
        db.close()


@pytest.fixture()
def client():
    with TestClient(app) as c:
        _limpiar_db()
        yield c
        app.dependency_overrides.clear()
        _limpiar_db()


def _seed_alumno(nombres: str = "Lucas", apellidos: str = "Perez", rut: str = "22222222-2"):
    db = SessionLocal()
    try:
        institucion = Institucion(nombre="Jardin Test")
        db.add(institucion)
        db.flush()
        curso = Curso(id_institucion=institucion.id_institucion, nombre="Medio A", nivel="Medio", capacidad_max=20)
        db.add(curso)
        db.flush()
        alumno = Alumno(
            id_institucion=institucion.id_institucion,
            id_curso=curso.id_curso,
            nombres=nombres,
            apellidos=apellidos,
            rut=rut,
            fecha_nacimiento=date(2020, 1, 1),
            estado="activo",
        )
        db.add(alumno)
        db.commit()
        return alumno.id_alumno
    finally:
        db.close()


def _seed_portal():
    id_alumno = _seed_alumno()
    db = SessionLocal()
    try:
        apoderado = Apoderado(
            nombres="Maria",
            apellidos="Gonzalez",
            rut="11111111-1",
            email="maria@test.cl",
        )
        db.add(apoderado)
        db.flush()
        db.add(AlumnoApoderado(id_apoderado=apoderado.id_apoderado, id_alumno=id_alumno, es_principal=True, puede_retirar=True))
        db.add(Asistencia(id_alumno=id_alumno, id_usuario_registro=1, fecha=date(2026, 7, 1), estado="presente"))
        db.add(Mensualidad(id_alumno=id_alumno, periodo="2026-07", monto_total=Decimal("100000"), descuento=Decimal("0"), estado="pendiente"))
        db.commit()
        return id_alumno
    finally:
        db.close()


def test_admin_crea_y_vincula_apoderado(client):
    app.dependency_overrides[get_current_user] = lambda: _usuario("administrador")
    id_alumno = _seed_alumno()

    res = client.post("/api/v1/apoderados/", json={
        "nombres": "Maria",
        "apellidos": "Gonzalez",
        "rut": "11.111.111-1",
        "email": "MARIA@TEST.CL",
        "telefono": "999999999",
        "direccion": None,
        "parentesco": "Madre",
    })
    assert res.status_code == 201
    apoderado = res.json()
    assert apoderado["email"] == "maria@test.cl"
    assert apoderado["rut"] == "11111111-1"

    vinculo = client.post(f"/api/v1/apoderados/{apoderado['id_apoderado']}/alumnos", json={"id_alumno": id_alumno})
    assert vinculo.status_code == 201
    assert vinculo.json()["alumnos"][0]["nombres"] == "Lucas"

    duplicado = client.post(f"/api/v1/apoderados/{apoderado['id_apoderado']}/alumnos", json={"id_alumno": id_alumno})
    assert duplicado.status_code == 400


def test_portal_solo_entrega_alumnos_asociados(client):
    id_alumno = _seed_portal()
    otro_alumno = _seed_alumno(nombres="Ana", apellidos="Soto", rut="33333333-3")
    app.dependency_overrides[get_current_user] = lambda: _usuario("apoderado", email="maria@test.cl", rut="11.111.111-1")

    res = client.get("/api/v1/portal/mis-alumnos")
    assert res.status_code == 200
    assert [alumno["id_alumno"] for alumno in res.json()] == [id_alumno]

    asistencia = client.get(f"/api/v1/portal/mis-alumnos/{id_alumno}/asistencia")
    assert asistencia.status_code == 200
    assert asistencia.json()[0]["estado"] == "presente"

    pagos = client.get(f"/api/v1/portal/mis-alumnos/{id_alumno}/pagos")
    assert pagos.status_code == 200
    assert pagos.json()[0]["periodo"] == "2026-07"

    prohibido = client.get(f"/api/v1/portal/mis-alumnos/{otro_alumno}/asistencia")
    assert prohibido.status_code == 403
