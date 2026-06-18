from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.core.database import Base

class Curso(Base):
    __tablename__ = "curso"
    id_curso = Column(Integer, primary_key=True, index=True)
    id_institucion = Column(Integer, ForeignKey("institucion.id_institucion"), nullable=False)
    id_educadora = Column(Integer, ForeignKey("educadora.id_educadora"))
    nombre = Column(String(100), nullable=False)
    nivel = Column(String(50))
    capacidad_max = Column(Integer, nullable=False)
    horario = Column(String(200))
    activo = Column(Boolean, default=True)
    alumnos = relationship("Alumno", back_populates="curso")
