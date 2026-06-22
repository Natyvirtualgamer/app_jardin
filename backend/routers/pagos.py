from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal
from backend.core.database import get_db
from backend.core.deps import get_current_user
from backend.models.pago import Mensualidad, Pago

router = APIRouter()

# ── Mensualidades ───────────────────────────────────────────────────────

class MensualidadCreate(BaseModel):
    id_alumno: int
    periodo: str  # "2026-06"
    monto_total: Decimal
    descuento: Decimal = 0
    beca: bool = False
    fecha_vencimiento: date | None = None

class MensualidadOut(BaseModel):
    id_mensualidad: int
    id_alumno: int
    periodo: str
    monto_total: Decimal
    descuento: Decimal
    beca: bool
    estado: str
    fecha_vencimiento: date | None
    class Config:
        from_attributes = True

@router.get("/mensualidades", response_model=List[MensualidadOut])
def listar_mensualidades(
    id_alumno: int | None = None,
    estado: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Mensualidad)
    if id_alumno:
        query = query.filter(Mensualidad.id_alumno == id_alumno)
    if estado:
        query = query.filter(Mensualidad.estado == estado)
    return query.order_by(Mensualidad.periodo.desc()).all()

@router.post("/mensualidades", response_model=MensualidadOut, status_code=201)
def crear_mensualidad(
    datos: MensualidadCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    mensualidad = Mensualidad(**datos.dict())
    db.add(mensualidad)
    db.commit()
    db.refresh(mensualidad)
    return mensualidad

# ── Pagos ────────────────────────────────────────────────────────────────

class PagoCreate(BaseModel):
    id_mensualidad: int
    monto: Decimal
    metodo_pago: str  # efectivo, debito, credito, transferencia
    comprobante_ref: str | None = None
    observacion: str | None = None

class PagoOut(BaseModel):
    id_pago: int
    id_mensualidad: int
    monto: Decimal
    metodo_pago: str
    fecha_pago: datetime
    comprobante_ref: str | None
    class Config:
        from_attributes = True

@router.get("/", response_model=List[PagoOut])
def listar_pagos(
    id_mensualidad: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Pago)
    if id_mensualidad:
        query = query.filter(Pago.id_mensualidad == id_mensualidad)
    return query.order_by(Pago.fecha_pago.desc()).all()

@router.post("/", response_model=PagoOut, status_code=201)
def registrar_pago(
    datos: PagoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    mensualidad = db.query(Mensualidad).filter(Mensualidad.id_mensualidad == datos.id_mensualidad).first()
    if not mensualidad:
        raise HTTPException(status_code=404, detail="Mensualidad no encontrada")

    pago = Pago(**datos.dict(), id_usuario_registro=current_user.id_usuario)
    db.add(pago)
    db.flush()

    # Recalcula el estado de la mensualidad segun el total efectivamente pagado
    total_pagado = sum((p.monto for p in mensualidad.pagos), Decimal(0)) + datos.monto
    saldo = mensualidad.monto_total - mensualidad.descuento
    if total_pagado >= saldo:
        mensualidad.estado = "pagado"
    elif total_pagado > 0:
        mensualidad.estado = "parcial"

    db.commit()
    db.refresh(pago)
    return pago
