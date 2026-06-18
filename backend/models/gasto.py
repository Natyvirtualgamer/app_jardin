from sqlalchemy import Column, Integer, String, Numeric, Date, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from backend.core.database import Base

class CategoriaGasto(Base):
    __tablename__ = "categoria_gasto"
    id_categoria = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)

class Proveedor(Base):
    __tablename__ = "proveedor"
    id_proveedor = Column(Integer, primary_key=True, index=True)
    razon_social = Column(String(150), nullable=False)
    rut = Column(String(12), unique=True, nullable=False)
    contacto = Column(String(100))
    telefono = Column(String(20))
    email = Column(String(100))

class Gasto(Base):
    __tablename__ = "gasto"
    id_gasto = Column(Integer, primary_key=True, index=True)
    id_institucion = Column(Integer, ForeignKey("institucion.id_institucion"), nullable=False)
    id_categoria = Column(Integer, ForeignKey("categoria_gasto.id_categoria"), nullable=False)
    id_proveedor = Column(Integer, ForeignKey("proveedor.id_proveedor"))
    id_usuario_registro = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    descripcion = Column(Text, nullable=False)
    monto = Column(Numeric(10, 2), nullable=False)
    fecha_gasto = Column(Date, nullable=False)
    tipo_movimiento = Column(String(10), default="egreso")  # egreso, ingreso
    created_at = Column(DateTime(timezone=True), server_default=func.now())
