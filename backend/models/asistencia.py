from sqlalchemy import Column, Integer, String, Date, Time, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base

class Asistencia(Base):
    __tablename__ = "asistencia"
    id_asistencia = Column(Integer, primary_key=True, index=True)
    id_alumno = Column(Integer, ForeignKey("alumno.id_alumno"), nullable=False)
    id_usuario_registro = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    fecha = Column(Date, nullable=False)
    estado = Column(String(20), nullable=False)  # presente, ausente, atraso, retiro_anticipado
    hora_llegada = Column(Time)
    hora_salida = Column(Time)
    observacion = Column(Text)
    alumno = relationship("Alumno", back_populates="asistencias")
