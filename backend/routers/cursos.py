from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from backend.core.database import get_db
from backend.core.deps import get_current_user
from backend.models.curso import Curso

router = APIRouter()

class CursoCreate(BaseModel):
    id_institucion: int
    id_educadora: int | None = None
    nombre: str
    nivel: str | None = None
    capacidad_max: int
    horario: str | None = None

class CursoOut(BaseModel):
    id_curso: int
    nombre: str
    nivel: str | None
    capacidad_max: int
    horario: str | None
    activo: bool
    class Config:
        from_attributes = True

@router.get("/", response_model=List[CursoOut])
def listar_cursos(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Curso).filter(Curso.activo == True).all()

@router.post("/", response_model=CursoOut, status_code=201)
def crear_curso(curso: CursoCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db_curso = Curso(**curso.dict())
    db.add(db_curso)
    db.commit()
    db.refresh(db_curso)
    return db_curso

@router.get("/{id_curso}", response_model=CursoOut)
def obtener_curso(id_curso: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    curso = db.query(Curso).filter(Curso.id_curso == id_curso).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return curso

@router.put("/{id_curso}", response_model=CursoOut)
def actualizar_curso(id_curso: int, datos: CursoCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    curso = db.query(Curso).filter(Curso.id_curso == id_curso).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    for key, value in datos.dict(exclude_unset=True).items():
        setattr(curso, key, value)
    db.commit()
    db.refresh(curso)
    return curso

@router.delete("/{id_curso}", status_code=204)
def eliminar_curso(id_curso: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    curso = db.query(Curso).filter(Curso.id_curso == id_curso).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    curso.activo = False  # Soft delete — preserva historial de alumnos asociados
    db.commit()
