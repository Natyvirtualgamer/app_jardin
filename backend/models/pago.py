from sqlalchemy import Column, Integer, String, Numeric, Boolean, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database import Base

class Mensualidad(Base):
    __tablename__ = "mensualidad"
    id_mensualidad = Column(Integer, primary_key=True, index=True)
    id_alumno = Column(Integer, ForeignKey("alumno.id_alumno"), nullable=False)
    periodo = Column(String(7), nullable=False)  # 2024-06
    monto_total = Column(Numeric(10, 2), nullable=False)
    descuento = Column(Numeric(10, 2), default=0)
    beca = Column(Boolean, default=False)
    estado = Column(String(20), default="pendiente")  # pendiente, parcial, pagado
    fecha_vencimiento = Column(Date)
    pagos = relationship("Pago", back_populates="mensualidad")

class Pago(Base):
    __tablename__ = "pago"
    id_pago = Column(Integer, primary_key=True, index=True)
    id_mensualidad = Column(Integer, ForeignKey("mensualidad.id_mensualidad"), nullable=False)
    id_usuario_registro = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    monto = Column(Numeric(10, 2), nullable=False)
    metodo_pago = Column(String(30), nullable=False)  # efectivo, debito, credito, transferencia
    fecha_pago = Column(DateTime(timezone=True), server_default=func.now())
    comprobante_ref = Column(String(100))
    observacion = Column(Text)
    mensualidad = relationship("Mensualidad", back_populates="pagos")
