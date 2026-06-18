# educadora.py — Educadora de parvulos a cargo de un curso.
# Requerida porque curso.id_educadora referencia educadora.id_educadora
# via ForeignKey y la tabla no existia. Extiende a Usuario (1:1) en vez
# de duplicar nombre/apellido/rut, igual que en docs/diagrams/03_modelo_datos_er.puml.
from sqlalchemy import Column, Integer, String, ForeignKey
from backend.core.database import Base


class Educadora(Base):
    __tablename__ = "educadora"

    id_educadora = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), unique=True, nullable=False)
    especialidad = Column(String(100))
    titulo = Column(String(150))
