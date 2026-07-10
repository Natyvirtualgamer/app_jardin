from datetime import date, datetime, time
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from backend.core.apoderado_utils import get_apoderado_for_user
from backend.core.database import get_db
from backend.core.deps import require_roles
from backend.models.alumno import Alumno, AlumnoApoderado
from backend.models.asistencia import Asistencia
from backend.models.pago import Mensualidad

router = APIRouter()


class PortalAlumnoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_alumno: int
    nombres: str
    apellidos: str
    rut: str
    fecha_nacimiento: date
    alergias: str | None = None
    medicamentos: str | None = None
    observaciones: str | None = None
    estado: str
    curso: str | None = None


class PortalAsistenciaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_asistencia: int
    fecha: date
    estado: str
    hora_llegada: time | None = None
    hora_salida: time | None = None
    observacion: str | None = None


class PortalPagoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_pago: int
    monto: Decimal
    metodo_pago: str
    fecha_pago: datetime
    comprobante_ref: str | None = None
    observacion: str | None = None


class PortalMensualidadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_mensualidad: int
    periodo: str
    monto_total: Decimal
    descuento: Decimal
    beca: bool
    estado: str
    fecha_vencimiento: date | None = None
    pagos: List[PortalPagoOut] = Field(default_factory=list)


def _curso_nombre(alumno: Alumno) -> str | None:
    if not alumno.curso:
        return None
    if alumno.curso.nivel:
        return f"{alumno.curso.nombre} - {alumno.curso.nivel}"
    return alumno.curso.nombre


def _alumno_out(alumno: Alumno) -> PortalAlumnoOut:
    return PortalAlumnoOut(
        id_alumno=alumno.id_alumno,
        nombres=alumno.nombres,
        apellidos=alumno.apellidos,
        rut=alumno.rut,
        fecha_nacimiento=alumno.fecha_nacimiento,
        alergias=alumno.alergias,
        medicamentos=alumno.medicamentos,
        observaciones=alumno.observaciones,
        estado=alumno.estado,
        curso=_curso_nombre(alumno),
    )


def _relacion_apoderado_alumno(db: Session, current_user, id_alumno: int) -> AlumnoApoderado:
    apoderado = get_apoderado_for_user(db, current_user)
    if not apoderado:
        raise HTTPException(status_code=403, detail="No tienes una ficha de apoderado asociada a esta cuenta")

    relacion = db.query(AlumnoApoderado).filter(
        AlumnoApoderado.id_apoderado == apoderado.id_apoderado,
        AlumnoApoderado.id_alumno == id_alumno,
    ).first()
    if not relacion:
        raise HTTPException(status_code=403, detail="No tienes permiso para consultar este estudiante")
    return relacion


@router.get("/mis-alumnos", response_model=List[PortalAlumnoOut])
def mis_alumnos(db: Session = Depends(get_db), current_user=Depends(require_roles("apoderado"))):
    apoderado = get_apoderado_for_user(db, current_user)
    if not apoderado:
        return []

    relaciones = (
        db.query(AlumnoApoderado)
        .join(Alumno, AlumnoApoderado.id_alumno == Alumno.id_alumno)
        .filter(AlumnoApoderado.id_apoderado == apoderado.id_apoderado, Alumno.estado == "activo")
        .order_by(Alumno.apellidos, Alumno.nombres)
        .all()
    )
    return [_alumno_out(rel.alumno) for rel in relaciones]


@router.get("/mis-alumnos/{id_alumno}/asistencia", response_model=List[PortalAsistenciaOut])
def asistencia_alumno(id_alumno: int, db: Session = Depends(get_db), current_user=Depends(require_roles("apoderado"))):
    _relacion_apoderado_alumno(db, current_user, id_alumno)
    registros = (
        db.query(Asistencia)
        .filter(Asistencia.id_alumno == id_alumno)
        .order_by(Asistencia.fecha.desc())
        .all()
    )
    return [
        PortalAsistenciaOut(
            id_asistencia=registro.id_asistencia,
            fecha=registro.fecha,
            estado=registro.estado,
            hora_llegada=registro.hora_llegada,
            hora_salida=registro.hora_salida,
            observacion=registro.observacion,
        )
        for registro in registros
    ]


@router.get("/mis-alumnos/{id_alumno}/pagos", response_model=List[PortalMensualidadOut])
def pagos_alumno(id_alumno: int, db: Session = Depends(get_db), current_user=Depends(require_roles("apoderado"))):
    _relacion_apoderado_alumno(db, current_user, id_alumno)
    mensualidades = (
        db.query(Mensualidad)
        .filter(Mensualidad.id_alumno == id_alumno)
        .order_by(Mensualidad.periodo.desc())
        .all()
    )
    return [
        PortalMensualidadOut(
            id_mensualidad=m.id_mensualidad,
            periodo=m.periodo,
            monto_total=m.monto_total,
            descuento=m.descuento,
            beca=m.beca,
            estado=m.estado,
            fecha_vencimiento=m.fecha_vencimiento,
            pagos=[
                PortalPagoOut(
                    id_pago=p.id_pago,
                    monto=p.monto,
                    metodo_pago=p.metodo_pago,
                    fecha_pago=p.fecha_pago,
                    comprobante_ref=p.comprobante_ref,
                    observacion=p.observacion,
                )
                for p in sorted(m.pagos, key=lambda pago: pago.fecha_pago, reverse=True)
            ],
        )
        for m in mensualidades
    ]
