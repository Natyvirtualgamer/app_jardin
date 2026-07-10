from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core.apoderado_utils import normalize_email, normalize_rut
from backend.core.database import get_db
from backend.core.deps import require_roles
from backend.models.alumno import Alumno, AlumnoApoderado, Apoderado

router = APIRouter()

APODERADOS_READ_ROLES = ("administrador", "direccion", "recepcion")
APODERADOS_WRITE_ROLES = ("administrador", "direccion", "recepcion")


class AlumnoAsociadoOut(BaseModel):
    id_alumno: int
    nombres: str
    apellidos: str
    rut: str
    fecha_nacimiento: date
    curso: str | None = None
    es_principal: bool
    puede_retirar: bool


class ApoderadoIn(BaseModel):
    nombres: str
    apellidos: str
    rut: str
    email: str
    telefono: str | None = None
    direccion: str | None = None
    parentesco: str | None = None


class VincularAlumnoIn(BaseModel):
    id_alumno: int
    es_principal: bool = False
    puede_retirar: bool = False


class ApoderadoOut(BaseModel):
    id_apoderado: int
    nombres: str
    apellidos: str
    rut: str
    email: str
    telefono: str | None = None
    direccion: str | None = None
    parentesco: str | None = None
    alumnos: List[AlumnoAsociadoOut] = Field(default_factory=list)


def _curso_nombre(alumno: Alumno) -> str | None:
    if not alumno.curso:
        return None
    if alumno.curso.nivel:
        return f"{alumno.curso.nombre} - {alumno.curso.nivel}"
    return alumno.curso.nombre


def _apoderado_out(db: Session, apoderado: Apoderado) -> ApoderadoOut:
    relaciones = (
        db.query(AlumnoApoderado)
        .join(Alumno, AlumnoApoderado.id_alumno == Alumno.id_alumno)
        .filter(AlumnoApoderado.id_apoderado == apoderado.id_apoderado)
        .order_by(Alumno.apellidos, Alumno.nombres)
        .all()
    )
    return ApoderadoOut(
        id_apoderado=apoderado.id_apoderado,
        nombres=apoderado.nombres,
        apellidos=apoderado.apellidos,
        rut=apoderado.rut,
        email=apoderado.email,
        telefono=apoderado.telefono,
        direccion=apoderado.direccion,
        parentesco=apoderado.parentesco,
        alumnos=[
            AlumnoAsociadoOut(
                id_alumno=rel.alumno.id_alumno,
                nombres=rel.alumno.nombres,
                apellidos=rel.alumno.apellidos,
                rut=rel.alumno.rut,
                fecha_nacimiento=rel.alumno.fecha_nacimiento,
                curso=_curso_nombre(rel.alumno),
                es_principal=rel.es_principal,
                puede_retirar=rel.puede_retirar,
            )
            for rel in relaciones
        ],
    )


def _obtener_apoderado(db: Session, id_apoderado: int) -> Apoderado:
    apoderado = db.query(Apoderado).filter(Apoderado.id_apoderado == id_apoderado).first()
    if not apoderado:
        raise HTTPException(status_code=404, detail="Apoderado no encontrado")
    return apoderado


def _obtener_alumno_activo(db: Session, id_alumno: int) -> Alumno:
    alumno = db.query(Alumno).filter(Alumno.id_alumno == id_alumno, Alumno.estado == "activo").first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado o inactivo")
    return alumno


def _validar_unicos(db: Session, email: str, rut: str, id_apoderado: int | None = None) -> None:
    email_normalizado = normalize_email(email)
    rut_normalizado = normalize_rut(rut)

    email_query = db.query(Apoderado).filter(func.lower(Apoderado.email) == email_normalizado)
    if id_apoderado:
        email_query = email_query.filter(Apoderado.id_apoderado != id_apoderado)
    if email_query.first():
        raise HTTPException(status_code=400, detail="Ya existe un apoderado con ese correo")

    for apoderado in db.query(Apoderado).all():
        if id_apoderado and apoderado.id_apoderado == id_apoderado:
            continue
        if normalize_rut(apoderado.rut) == rut_normalizado:
            raise HTTPException(status_code=400, detail="Ya existe un apoderado con ese RUT")


@router.get("", response_model=List[ApoderadoOut])
@router.get("/", response_model=List[ApoderadoOut], include_in_schema=False)
def listar_apoderados(db: Session = Depends(get_db), current_user=Depends(require_roles(*APODERADOS_READ_ROLES))):
    apoderados = db.query(Apoderado).order_by(Apoderado.apellidos, Apoderado.nombres).all()
    return [_apoderado_out(db, apoderado) for apoderado in apoderados]


@router.post("", response_model=ApoderadoOut, status_code=201)
@router.post("/", response_model=ApoderadoOut, status_code=201, include_in_schema=False)
def crear_apoderado(datos: ApoderadoIn, db: Session = Depends(get_db), current_user=Depends(require_roles(*APODERADOS_WRITE_ROLES))):
    _validar_unicos(db, datos.email, datos.rut)
    apoderado = Apoderado(
        nombres=datos.nombres.strip(),
        apellidos=datos.apellidos.strip(),
        rut=normalize_rut(datos.rut),
        email=normalize_email(datos.email),
        telefono=datos.telefono,
        direccion=datos.direccion,
        parentesco=datos.parentesco,
    )
    db.add(apoderado)
    db.commit()
    db.refresh(apoderado)
    return _apoderado_out(db, apoderado)


@router.get("/{id_apoderado}", response_model=ApoderadoOut)
def obtener_apoderado(id_apoderado: int, db: Session = Depends(get_db), current_user=Depends(require_roles(*APODERADOS_READ_ROLES))):
    return _apoderado_out(db, _obtener_apoderado(db, id_apoderado))


@router.put("/{id_apoderado}", response_model=ApoderadoOut)
def actualizar_apoderado(id_apoderado: int, datos: ApoderadoIn, db: Session = Depends(get_db), current_user=Depends(require_roles(*APODERADOS_WRITE_ROLES))):
    apoderado = _obtener_apoderado(db, id_apoderado)
    _validar_unicos(db, datos.email, datos.rut, id_apoderado=id_apoderado)

    apoderado.nombres = datos.nombres.strip()
    apoderado.apellidos = datos.apellidos.strip()
    apoderado.rut = normalize_rut(datos.rut)
    apoderado.email = normalize_email(datos.email)
    apoderado.telefono = datos.telefono
    apoderado.direccion = datos.direccion
    apoderado.parentesco = datos.parentesco
    db.commit()
    db.refresh(apoderado)
    return _apoderado_out(db, apoderado)


@router.post("/{id_apoderado}/alumnos", response_model=ApoderadoOut, status_code=201)
def vincular_alumno(id_apoderado: int, datos: VincularAlumnoIn, db: Session = Depends(get_db), current_user=Depends(require_roles(*APODERADOS_WRITE_ROLES))):
    apoderado = _obtener_apoderado(db, id_apoderado)
    _obtener_alumno_activo(db, datos.id_alumno)

    existe = db.query(AlumnoApoderado).filter(
        AlumnoApoderado.id_apoderado == id_apoderado,
        AlumnoApoderado.id_alumno == datos.id_alumno,
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="Este alumno ya está vinculado al apoderado")

    db.add(AlumnoApoderado(
        id_apoderado=id_apoderado,
        id_alumno=datos.id_alumno,
        es_principal=datos.es_principal,
        puede_retirar=datos.puede_retirar,
    ))
    db.commit()
    db.refresh(apoderado)
    return _apoderado_out(db, apoderado)


@router.delete("/{id_apoderado}/alumnos/{id_alumno}", status_code=204)
def desvincular_alumno(id_apoderado: int, id_alumno: int, db: Session = Depends(get_db), current_user=Depends(require_roles(*APODERADOS_WRITE_ROLES))):
    _obtener_apoderado(db, id_apoderado)
    relacion = db.query(AlumnoApoderado).filter(
        AlumnoApoderado.id_apoderado == id_apoderado,
        AlumnoApoderado.id_alumno == id_alumno,
    ).first()
    if not relacion:
        raise HTTPException(status_code=404, detail="Vínculo alumno-apoderado no encontrado")
    db.delete(relacion)
    db.commit()
