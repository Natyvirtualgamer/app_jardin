from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import date, time
from backend.core.database import get_db
from backend.core.deps import get_current_user
from backend.models.asistencia import Asistencia

router = APIRouter()

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

@router.get("/", response_model=List[AsistenciaOut])
def listar_asistencia(
    fecha: date | None = None,
    id_alumno: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Asistencia)
    if fecha:
        query = query.filter(Asistencia.fecha == fecha)
    if id_alumno:
        query = query.filter(Asistencia.id_alumno == id_alumno)
    return query.order_by(Asistencia.fecha.desc()).all()

@router.post("/", response_model=AsistenciaOut, status_code=201)
def registrar_asistencia(
    datos: AsistenciaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
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
    current_user=Depends(get_current_user),
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
    current_user=Depends(get_current_user),
):
    registro = db.query(Asistencia).filter(Asistencia.id_asistencia == id_asistencia).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro de asistencia no encontrado")
    db.delete(registro)  # Sin estado "inactivo" en el modelo — corrige errores de tipeo del dia
    db.commit()
