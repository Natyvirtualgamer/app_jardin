# institucion.py — Entidad raiz multi-tenant (jardin / sala cuna / centro)
# Requerida porque usuario, alumno, curso y gasto referencian
# institucion.id_institucion via ForeignKey y la tabla no existia.
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from backend.core.database import Base


class Institucion(Base):
    __tablename__ = "institucion"

    id_institucion = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    rut = Column(String(12), unique=True)
    direccion = Column(String(200))
    telefono = Column(String(20))
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
