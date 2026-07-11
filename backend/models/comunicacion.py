from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.core.database import Base


class Comunicacion(Base):
    __tablename__ = "comunicacion"

    id_comunicacion = Column(Integer, primary_key=True, index=True)
    id_alumno = Column(Integer, ForeignKey("alumno.id_alumno"), nullable=False)
    id_apoderado = Column(Integer, ForeignKey("apoderado.id_apoderado"), nullable=False)
    asunto = Column(String(150), nullable=False)
    estado = Column(String(20), default="abierta", nullable=False)
    creado_por_usuario_id = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    alumno = relationship("Alumno")
    apoderado = relationship("Apoderado")
    creador = relationship("Usuario", foreign_keys=[creado_por_usuario_id])
    mensajes = relationship("ComunicacionMensaje", back_populates="comunicacion", cascade="all, delete-orphan")


class ComunicacionMensaje(Base):
    __tablename__ = "comunicacion_mensaje"

    id_mensaje = Column(Integer, primary_key=True, index=True)
    id_comunicacion = Column(Integer, ForeignKey("comunicacion.id_comunicacion"), nullable=False)
    id_usuario_autor = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    mensaje = Column(Text, nullable=False)
    fecha_envio = Column(DateTime(timezone=True), server_default=func.now())
    leido = Column(Boolean, default=False)

    comunicacion = relationship("Comunicacion", back_populates="mensajes")
    autor = relationship("Usuario")
