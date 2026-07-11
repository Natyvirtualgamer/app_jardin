from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import date, time
from backend.core.database import get_db
from backend.core.deps import require_roles
from backend.models.alumno import Alumno
from backend.models.asistencia import Asistencia

router = APIRouter()

ASISTENCIA_ROLES = ("administrador", "direccion", "educadora", "recepcion")

class AsistenciaCreate(BaseModel):
    id_alumno: int
    fecha: date
    estado: str  # presente, ausente, atraso, retiro_anticipado
    hora_llegada: time | None = None
    hora_salida: time | None = None
    observacion: str | None = None

class AsistenciaOut(BaseModel):
    id_asistencia: int
    id_alumno: int
    fecha: date
    estado: str
    hora_llegada: time | None
    hora_salida: time | None
    observacion: str | None
    class Config:
        from_attributes = True

def _rango_mes(mes: str) -> tuple[date, date]:
    try:
        year, month = [int(part) for part in mes.split("-")]
        inicio = date(year, month, 1)
        fin = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
        return inicio, fin
    except ValueError:
        raise HTTPException(status_code=400, detail="El mes debe tener formato AAAA-MM")

@router.get("/", response_model=List[AsistenciaOut])
def listar_asistencia(
    fecha: date | None = None,
    id_alumno: int | None = None,
    id_curso: int | None = None,
    mes: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ASISTENCIA_ROLES)),
):
    query = db.query(Asistencia)
    if id_curso:
        query = query.join(Alumno, Asistencia.id_alumno == Alumno.id_alumno).filter(Alumno.id_curso == id_curso)
    if fecha:
        query = query.filter(Asistencia.fecha == fecha)
    if id_alumno:
        query = query.filter(Asistencia.id_alumno == id_alumno)
    if mes:
        inicio, fin = _rango_mes(mes)
        query = query.filter(Asistencia.fecha >= inicio, Asistencia.fecha < fin)
    return query.order_by(Asistencia.fecha.desc()).all()

@router.post("/", response_model=AsistenciaOut, status_code=201)
def registrar_asistencia(
    datos: AsistenciaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ASISTENCIA_ROLES)),
):
    existente = db.query(Asistencia).filter(
        Asistencia.id_alumno == datos.id_alumno,
        Asistencia.fecha == datos.fecha,
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un registro de asistencia para este alumno en esta fecha")
    registro = Asistencia(**datos.dict(), id_usuario_registro=current_user.id_usuario)
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro

@router.put("/{id_asistencia}", response_model=AsistenciaOut)
def actualizar_asistencia(
    id_asistencia: int,
    datos: AsistenciaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ASISTENCIA_ROLES)),
):
    registro = db.query(Asistencia).filter(Asistencia.id_asistencia == id_asistencia).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro de asistencia no encontrado")
    for key, value in datos.dict(exclude_unset=True).items():
        setattr(registro, key, value)
    db.commit()
    db.refresh(registro)
    return registro

@router.delete("/{id_asistencia}", status_code=204)
def eliminar_asistencia(
    id_asistencia: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*ASISTENCIA_ROLES)),
):
    registro = db.query(Asistencia).filter(Asistencia.id_asistencia == id_asistencia).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro de asistencia no encontrado")
    db.delete(registro)  # Sin estado "inactivo" en el modelo — corrige errores de tipeo del dia
    db.commit()
