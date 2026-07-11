from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal
from backend.core.database import get_db
from backend.core.deps import require_roles
from backend.models.pago import Mensualidad, Pago

router = APIRouter()

PAGOS_READ_ROLES = ("administrador", "direccion", "finanzas")
PAGOS_WRITE_ROLES = ("administrador", "finanzas")
METODOS_PAGO_VALIDOS = {"efectivo", "debito", "credito", "transferencia"}

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
    current_user=Depends(require_roles(*PAGOS_READ_ROLES)),
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
    current_user=Depends(require_roles(*PAGOS_WRITE_ROLES)),
):
    if datos.monto_total <= 0:
        raise HTTPException(status_code=400, detail="El monto total debe ser mayor a cero")
    if datos.descuento < 0:
        raise HTTPException(status_code=400, detail="El descuento no puede ser negativo")
    if datos.descuento > datos.monto_total:
        raise HTTPException(status_code=400, detail="El descuento no puede superar el monto total")

    existe = db.query(Mensualidad).filter(
        Mensualidad.id_alumno == datos.id_alumno,
        Mensualidad.periodo == datos.periodo,
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe una mensualidad para este alumno y periodo")

    estado = "pagado" if datos.monto_total - datos.descuento <= 0 else "pendiente"
    mensualidad = Mensualidad(**datos.dict(), estado=estado)
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

class PagoUpdate(BaseModel):
    monto: Decimal
    fecha_pago: datetime
    metodo_pago: str
    observacion: str | None = None

class PagoOut(BaseModel):
    id_pago: int
    id_mensualidad: int
    monto: Decimal
    metodo_pago: str
    fecha_pago: datetime
    comprobante_ref: str | None
    observacion: str | None = None
    class Config:
        from_attributes = True

def _saldo_mensualidad(mensualidad: Mensualidad) -> Decimal:
    return mensualidad.monto_total - (mensualidad.descuento or Decimal("0"))

def _total_pagado(mensualidad: Mensualidad, excluir_id_pago: int | None = None) -> Decimal:
    return sum(
        (p.monto for p in mensualidad.pagos if p.id_pago != excluir_id_pago),
        Decimal("0"),
    )

def _aplicar_estado_por_total(mensualidad: Mensualidad, total_pagado: Decimal) -> None:
    saldo = _saldo_mensualidad(mensualidad)
    if saldo <= 0 or total_pagado >= saldo:
        mensualidad.estado = "pagado"
    elif total_pagado > 0:
        mensualidad.estado = "parcial"
    else:
        mensualidad.estado = "pendiente"

def _recalcular_estado_mensualidad(mensualidad: Mensualidad) -> None:
    _aplicar_estado_por_total(mensualidad, _total_pagado(mensualidad))

@router.get("/", response_model=List[PagoOut])
def listar_pagos(
    id_mensualidad: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*PAGOS_READ_ROLES)),
):
    query = db.query(Pago)
    if id_mensualidad:
        query = query.filter(Pago.id_mensualidad == id_mensualidad)
    return query.order_by(Pago.fecha_pago.desc()).all()

@router.post("/", response_model=PagoOut, status_code=201)
def registrar_pago(
    datos: PagoCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*PAGOS_WRITE_ROLES)),
):
    if datos.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto del pago debe ser mayor a cero")
    if datos.metodo_pago not in METODOS_PAGO_VALIDOS:
        raise HTTPException(status_code=400, detail="Método de pago inválido")

    mensualidad = db.query(Mensualidad).filter(Mensualidad.id_mensualidad == datos.id_mensualidad).first()
    if not mensualidad:
        raise HTTPException(status_code=404, detail="Mensualidad no encontrada")

    total_pagado_actual = _total_pagado(mensualidad)
    saldo = _saldo_mensualidad(mensualidad)
    monto_pendiente = saldo - total_pagado_actual
    if monto_pendiente <= 0:
        raise HTTPException(status_code=400, detail="La mensualidad ya está pagada")
    if datos.monto > monto_pendiente:
        raise HTTPException(status_code=400, detail="El monto del pago supera el saldo pendiente")

    pago = Pago(**datos.dict(), id_usuario_registro=current_user.id_usuario)
    db.add(pago)
    db.flush()

    _aplicar_estado_por_total(mensualidad, total_pagado_actual + datos.monto)

    db.commit()
    db.refresh(pago)
    return pago

@router.put("/{id_pago}", response_model=PagoOut)
def actualizar_pago(
    id_pago: int,
    datos: PagoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*PAGOS_WRITE_ROLES)),
):
    if datos.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto del pago debe ser mayor a cero")
    if datos.metodo_pago not in METODOS_PAGO_VALIDOS:
        raise HTTPException(status_code=400, detail="Método de pago inválido")

    pago = db.query(Pago).filter(Pago.id_pago == id_pago).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    mensualidad = db.query(Mensualidad).filter(Mensualidad.id_mensualidad == pago.id_mensualidad).first()
    if not mensualidad:
        raise HTTPException(status_code=404, detail="Mensualidad no encontrada")

    saldo = _saldo_mensualidad(mensualidad)
    total_con_nuevo_monto = _total_pagado(mensualidad, excluir_id_pago=id_pago) + datos.monto
    if total_con_nuevo_monto > saldo:
        raise HTTPException(status_code=400, detail="El monto del pago supera el saldo de la mensualidad")

    pago.monto = datos.monto
    pago.fecha_pago = datos.fecha_pago
    pago.metodo_pago = datos.metodo_pago
    pago.observacion = datos.observacion
    _recalcular_estado_mensualidad(mensualidad)

    db.commit()
    db.refresh(pago)
    return pago

@router.delete("/{id_pago}")
def eliminar_pago(
    id_pago: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*PAGOS_WRITE_ROLES)),
):
    pago = db.query(Pago).filter(Pago.id_pago == id_pago).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    mensualidad = db.query(Mensualidad).filter(Mensualidad.id_mensualidad == pago.id_mensualidad).first()
    if not mensualidad:
        raise HTTPException(status_code=404, detail="Mensualidad no encontrada")

    db.delete(pago)
    db.flush()
    _recalcular_estado_mensualidad(mensualidad)
    db.commit()
    return {"message": "Pago eliminado correctamente. La mensualidad fue recalculada."}
