from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base

class Alumno(Base):
    __tablename__ = "alumno"
    id_alumno = Column(Integer, primary_key=True, index=True)
    id_curso = Column(Integer, ForeignKey("curso.id_curso"))
    id_institucion = Column(Integer, ForeignKey("institucion.id_institucion"), nullable=False)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    rut = Column(String(12), unique=True, nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    foto_url = Column(String(300))
    alergias = Column(Text)
    medicamentos = Column(Text)
    observaciones = Column(Text)
    estado = Column(String(20), default="activo")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    curso = relationship("Curso", back_populates="alumnos")
    apoderados = relationship("AlumnoApoderado", back_populates="alumno")
    asistencias = relationship("Asistencia", back_populates="alumno")

class AlumnoApoderado(Base):
    __tablename__ = "alumno_apoderado"
    id_alumno = Column(Integer, ForeignKey("alumno.id_alumno"), primary_key=True)
    id_apoderado = Column(Integer, ForeignKey("apoderado.id_apoderado"), primary_key=True)
    es_principal = Column(Boolean, default=False)
    puede_retirar = Column(Boolean, default=False)
    alumno = relationship("Alumno", back_populates="apoderados")
    apoderado = relationship("Apoderado", back_populates="alumnos")

class Apoderado(Base):
    __tablename__ = "apoderado"
    id_apoderado = Column(Integer, primary_key=True, index=True)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    rut = Column(String(12), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    telefono = Column(String(20))
    direccion = Column(Text)
    parentesco = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    alumnos = relationship("AlumnoApoderado", back_populates="apoderado")
