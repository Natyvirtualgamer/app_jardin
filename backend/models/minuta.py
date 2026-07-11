from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.core.database import Base


class MinutaSemanal(Base):
    __tablename__ = "minuta_semanal"
    __table_args__ = (UniqueConstraint("id_curso", "semana_inicio", "dia_semana", name="uq_minuta_curso_semana_dia"),)

    id_minuta = Column(Integer, primary_key=True, index=True)
    id_curso = Column(Integer, ForeignKey("curso.id_curso"), nullable=False)
    semana_inicio = Column(Date, nullable=False)
    dia_semana = Column(Integer, nullable=False)  # 1=lunes, 5=viernes
    desayuno = Column(Text)
    almuerzo = Column(Text)
    colacion = Column(Text)
    observaciones = Column(Text)
    id_usuario_registro = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    curso = relationship("Curso")
