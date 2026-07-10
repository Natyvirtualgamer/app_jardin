from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import date
from backend.core.database import get_db
from backend.core.deps import require_roles
from backend.models.alumno import Alumno

router = APIRouter()

ALUMNOS_READ_ROLES = ("administrador", "direccion", "educadora", "finanzas", "recepcion")
ALUMNOS_WRITE_ROLES = ("administrador", "direccion", "recepcion")

class AlumnoCreate(BaseModel):
    id_curso: int | None = None
    id_institucion: int
    nombres: str
    apellidos: str
    rut: str
    fecha_nacimiento: date
    alergias: str | None = None
    medicamentos: str | None = None
    observaciones: str | None = None

class AlumnoOut(BaseModel):
    id_alumno: int
    id_curso: int | None
    id_institucion: int
    nombres: str
    apellidos: str
    rut: str
    fecha_nacimiento: date
    estado: str
    alergias: str | None
    medicamentos: str | None
    observaciones: str | None
    class Config:
        from_attributes = True

@router.get("/", response_model=List[AlumnoOut])
def listar_alumnos(db: Session = Depends(get_db), current_user=Depends(require_roles(*ALUMNOS_READ_ROLES))):
    return db.query(Alumno).filter(Alumno.estado == "activo").all()

@router.post("/", response_model=AlumnoOut, status_code=201)
def crear_alumno(alumno: AlumnoCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(*ALUMNOS_WRITE_ROLES))):
    # Validar RUT único
    existe = db.query(Alumno).filter(Alumno.rut == alumno.rut).first()
    if existe:
        raise HTTPException(status_code=400, detail="RUT ya registrado")
    db_alumno = Alumno(**alumno.dict())
    db.add(db_alumno)
    db.commit()
    db.refresh(db_alumno)
    return db_alumno

@router.get("/{id_alumno}", response_model=AlumnoOut)
def obtener_alumno(id_alumno: int, db: Session = Depends(get_db), current_user=Depends(require_roles(*ALUMNOS_READ_ROLES))):
    alumno = db.query(Alumno).filter(Alumno.id_alumno == id_alumno).first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    return alumno

@router.put("/{id_alumno}", response_model=AlumnoOut)
def actualizar_alumno(id_alumno: int, datos: AlumnoCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(*ALUMNOS_WRITE_ROLES))):
    alumno = db.query(Alumno).filter(Alumno.id_alumno == id_alumno).first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    for key, value in datos.dict(exclude_unset=True).items():
        setattr(alumno, key, value)
    db.commit()
    db.refresh(alumno)
    return alumno

@router.delete("/{id_alumno}", status_code=204)
def eliminar_alumno(id_alumno: int, db: Session = Depends(get_db), current_user=Depends(require_roles(*ALUMNOS_WRITE_ROLES))):
    alumno = db.query(Alumno).filter(Alumno.id_alumno == id_alumno).first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    alumno.estado = "inactivo"  # Soft delete
    db.commit()
