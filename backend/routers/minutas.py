from datetime import date, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.deps import require_roles
from backend.core.apoderado_utils import get_apoderado_for_user
from backend.models.alumno import Alumno, AlumnoApoderado
from backend.models.curso import Curso
from backend.models.minuta import MinutaSemanal

router = APIRouter()

MINUTA_ROLES = ("administrador", "direccion", "educadora", "recepcion")


class MinutaBase(BaseModel):
    id_curso: int
    semana_inicio: date
    dia_semana: int
    desayuno: str | None = None
    almuerzo: str | None = None
    colacion: str | None = None
    observaciones: str | None = None


class MinutaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_minuta: int
    id_curso: int
    semana_inicio: date
    dia_semana: int
    desayuno: str | None = None
    almuerzo: str | None = None
    colacion: str | None = None
    observaciones: str | None = None


def _semana_actual() -> date:
    hoy = date.today()
    return hoy - timedelta(days=hoy.weekday())


def _validar_minuta(db: Session, datos: MinutaBase) -> Curso:
    if datos.dia_semana < 1 or datos.dia_semana > 5:
        raise HTTPException(status_code=400, detail="El día debe estar entre lunes y viernes")
    if datos.semana_inicio.weekday() != 0:
        raise HTTPException(status_code=400, detail="La semana debe iniciar un lunes")
    curso = db.query(Curso).filter(Curso.id_curso == datos.id_curso, Curso.activo == True).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return curso


def _relacion_apoderado_alumno(db: Session, current_user, id_alumno: int) -> AlumnoApoderado:
    apoderado = get_apoderado_for_user(db, current_user)
    if not apoderado:
        raise HTTPException(status_code=403, detail="No tienes una ficha de apoderado asociada a esta cuenta")
    relacion = db.query(AlumnoApoderado).filter(
        AlumnoApoderado.id_apoderado == apoderado.id_apoderado,
        AlumnoApoderado.id_alumno == id_alumno,
    ).first()
    if not relacion:
        raise HTTPException(status_code=403, detail="No tienes permiso para consultar este estudiante")
    return relacion


@router.get("/minutas", response_model=List[MinutaOut])
def listar_minutas(
    id_curso: int | None = None,
    semana_inicio: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*MINUTA_ROLES)),
):
    query = db.query(MinutaSemanal)
    if id_curso:
        query = query.filter(MinutaSemanal.id_curso == id_curso)
    if semana_inicio:
        query = query.filter(MinutaSemanal.semana_inicio == semana_inicio)
    return query.order_by(MinutaSemanal.semana_inicio.desc(), MinutaSemanal.dia_semana).all()


@router.post("/minutas", response_model=MinutaOut, status_code=201)
def crear_minuta(
    datos: MinutaBase,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*MINUTA_ROLES)),
):
    _validar_minuta(db, datos)
    existe = db.query(MinutaSemanal).filter(
        MinutaSemanal.id_curso == datos.id_curso,
        MinutaSemanal.semana_inicio == datos.semana_inicio,
        MinutaSemanal.dia_semana == datos.dia_semana,
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe una minuta para ese curso, semana y día")
    minuta = MinutaSemanal(**datos.model_dump(), id_usuario_registro=current_user.id_usuario)
    db.add(minuta)
    db.commit()
    db.refresh(minuta)
    return minuta


@router.put("/minutas/{id_minuta}", response_model=MinutaOut)
def actualizar_minuta(
    id_minuta: int,
    datos: MinutaBase,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*MINUTA_ROLES)),
):
    _validar_minuta(db, datos)
    minuta = db.query(MinutaSemanal).filter(MinutaSemanal.id_minuta == id_minuta).first()
    if not minuta:
        raise HTTPException(status_code=404, detail="Minuta no encontrada")
    duplicada = db.query(MinutaSemanal).filter(
        MinutaSemanal.id_minuta != id_minuta,
        MinutaSemanal.id_curso == datos.id_curso,
        MinutaSemanal.semana_inicio == datos.semana_inicio,
        MinutaSemanal.dia_semana == datos.dia_semana,
    ).first()
    if duplicada:
        raise HTTPException(status_code=400, detail="Ya existe una minuta para ese curso, semana y día")
    for key, value in datos.model_dump().items():
        setattr(minuta, key, value)
    db.commit()
    db.refresh(minuta)
    return minuta


@router.delete("/minutas/{id_minuta}", status_code=204)
def eliminar_minuta(
    id_minuta: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*MINUTA_ROLES)),
):
    minuta = db.query(MinutaSemanal).filter(MinutaSemanal.id_minuta == id_minuta).first()
    if not minuta:
        raise HTTPException(status_code=404, detail="Minuta no encontrada")
    db.delete(minuta)
    db.commit()


@router.get("/portal/mis-alumnos/{id_alumno}/minuta", response_model=List[MinutaOut])
def minuta_portal(
    id_alumno: int,
    semana_inicio: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("apoderado")),
):
    _relacion_apoderado_alumno(db, current_user, id_alumno)
    alumno = db.query(Alumno).filter(Alumno.id_alumno == id_alumno).first()
    if not alumno or not alumno.id_curso:
        return []
    semana = semana_inicio or _semana_actual()
    return db.query(MinutaSemanal).filter(
        MinutaSemanal.id_curso == alumno.id_curso,
        MinutaSemanal.semana_inicio == semana,
    ).order_by(MinutaSemanal.dia_semana).all()
