from datetime import date, datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core.apoderado_utils import get_apoderado_for_user
from backend.core.database import get_db
from backend.core.deps import require_roles
from backend.models.alumno import Alumno, AlumnoApoderado, Apoderado
from backend.models.comunicacion import Comunicacion, ComunicacionMensaje

router = APIRouter()

PERSONAL_ROLES = ("administrador", "direccion", "educadora", "recepcion")
ESTADOS_COMUNICACION = {"abierta", "respondida", "cerrada"}


class MensajeCreate(BaseModel):
    mensaje: str


class ComunicacionCreatePortal(BaseModel):
    asunto: str
    mensaje: str


class ComunicacionCreatePersonal(BaseModel):
    id_alumno: int
    id_apoderado: int
    asunto: str
    mensaje: str


class EstadoUpdate(BaseModel):
    estado: str


class MensajeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_mensaje: int
    id_usuario_autor: int
    autor: str
    rol_autor: str
    mensaje: str
    fecha_envio: datetime
    leido: bool


class ComunicacionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_comunicacion: int
    id_alumno: int
    alumno: str
    id_apoderado: int
    apoderado: str
    asunto: str
    estado: str
    fecha_creacion: datetime
    fecha_actualizacion: datetime | None = None
    mensajes: List[MensajeOut]


def _texto_obligatorio(valor: str, campo: str) -> str:
    texto = valor.strip()
    if not texto:
        raise HTTPException(status_code=400, detail=f"{campo} es obligatorio")
    return texto


def _comunicacion_out(comunicacion: Comunicacion) -> ComunicacionOut:
    return ComunicacionOut(
        id_comunicacion=comunicacion.id_comunicacion,
        id_alumno=comunicacion.id_alumno,
        alumno=f"{comunicacion.alumno.nombres} {comunicacion.alumno.apellidos}",
        id_apoderado=comunicacion.id_apoderado,
        apoderado=f"{comunicacion.apoderado.nombres} {comunicacion.apoderado.apellidos}",
        asunto=comunicacion.asunto,
        estado=comunicacion.estado,
        fecha_creacion=comunicacion.fecha_creacion,
        fecha_actualizacion=comunicacion.fecha_actualizacion,
        mensajes=[
            MensajeOut(
                id_mensaje=mensaje.id_mensaje,
                id_usuario_autor=mensaje.id_usuario_autor,
                autor=f"{mensaje.autor.nombre} {mensaje.autor.apellido}",
                rol_autor=mensaje.autor.rol.nombre,
                mensaje=mensaje.mensaje,
                fecha_envio=mensaje.fecha_envio,
                leido=mensaje.leido,
            )
            for mensaje in sorted(comunicacion.mensajes, key=lambda item: item.fecha_envio)
        ],
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


def _comunicacion_apoderado(db: Session, current_user, id_comunicacion: int) -> Comunicacion:
    apoderado = get_apoderado_for_user(db, current_user)
    if not apoderado:
        raise HTTPException(status_code=403, detail="No tienes una ficha de apoderado asociada a esta cuenta")

    comunicacion = db.query(Comunicacion).filter(
        Comunicacion.id_comunicacion == id_comunicacion,
        Comunicacion.id_apoderado == apoderado.id_apoderado,
    ).first()
    if not comunicacion:
        raise HTTPException(status_code=404, detail="Comunicación no encontrada")
    return comunicacion


def _validar_alumno_apoderado(db: Session, id_alumno: int, id_apoderado: int) -> None:
    existe = db.query(AlumnoApoderado).filter(
        AlumnoApoderado.id_alumno == id_alumno,
        AlumnoApoderado.id_apoderado == id_apoderado,
    ).first()
    if not existe:
        raise HTTPException(status_code=400, detail="El apoderado no está vinculado al alumno seleccionado")


def _agregar_mensaje(db: Session, comunicacion: Comunicacion, id_usuario: int, mensaje: str) -> ComunicacionMensaje:
    if comunicacion.estado == "cerrada":
        raise HTTPException(status_code=400, detail="La comunicación está cerrada")
    nuevo = ComunicacionMensaje(
        id_comunicacion=comunicacion.id_comunicacion,
        id_usuario_autor=id_usuario,
        mensaje=_texto_obligatorio(mensaje, "El mensaje"),
    )
    db.add(nuevo)
    return nuevo


@router.get("/portal/mis-alumnos/{id_alumno}/comunicaciones", response_model=List[ComunicacionOut])
def listar_comunicaciones_portal(
    id_alumno: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("apoderado")),
):
    relacion = _relacion_apoderado_alumno(db, current_user, id_alumno)
    comunicaciones = db.query(Comunicacion).filter(
        Comunicacion.id_alumno == id_alumno,
        Comunicacion.id_apoderado == relacion.id_apoderado,
    ).order_by(Comunicacion.fecha_actualizacion.desc()).all()
    return [_comunicacion_out(comunicacion) for comunicacion in comunicaciones]


@router.post("/portal/mis-alumnos/{id_alumno}/comunicaciones", response_model=ComunicacionOut, status_code=201)
def crear_comunicacion_portal(
    id_alumno: int,
    datos: ComunicacionCreatePortal,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("apoderado")),
):
    relacion = _relacion_apoderado_alumno(db, current_user, id_alumno)
    comunicacion = Comunicacion(
        id_alumno=id_alumno,
        id_apoderado=relacion.id_apoderado,
        asunto=_texto_obligatorio(datos.asunto, "El asunto"),
        estado="abierta",
        creado_por_usuario_id=current_user.id_usuario,
    )
    db.add(comunicacion)
    db.flush()
    _agregar_mensaje(db, comunicacion, current_user.id_usuario, datos.mensaje)
    db.commit()
    db.refresh(comunicacion)
    return _comunicacion_out(comunicacion)


@router.post("/portal/comunicaciones/{id_comunicacion}/mensajes", response_model=ComunicacionOut)
def responder_comunicacion_portal(
    id_comunicacion: int,
    datos: MensajeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("apoderado")),
):
    comunicacion = _comunicacion_apoderado(db, current_user, id_comunicacion)
    _agregar_mensaje(db, comunicacion, current_user.id_usuario, datos.mensaje)
    comunicacion.estado = "abierta"
    db.commit()
    db.refresh(comunicacion)
    return _comunicacion_out(comunicacion)


@router.get("/comunicaciones", response_model=List[ComunicacionOut])
def listar_comunicaciones(
    id_alumno: int | None = None,
    id_curso: int | None = None,
    id_apoderado: int | None = None,
    estado: str | None = None,
    fecha: date | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*PERSONAL_ROLES)),
):
    query = db.query(Comunicacion).join(Alumno, Comunicacion.id_alumno == Alumno.id_alumno)
    if id_alumno:
        query = query.filter(Comunicacion.id_alumno == id_alumno)
    if id_curso:
        query = query.filter(Alumno.id_curso == id_curso)
    if id_apoderado:
        query = query.filter(Comunicacion.id_apoderado == id_apoderado)
    if estado:
        if estado not in ESTADOS_COMUNICACION:
            raise HTTPException(status_code=400, detail="Estado de comunicación inválido")
        query = query.filter(Comunicacion.estado == estado)
    if fecha:
        query = query.filter(func.date(Comunicacion.fecha_creacion) == fecha)
    comunicaciones = query.order_by(Comunicacion.fecha_actualizacion.desc()).all()
    return [_comunicacion_out(comunicacion) for comunicacion in comunicaciones]


@router.post("/comunicaciones", response_model=ComunicacionOut, status_code=201)
def crear_comunicacion_personal(
    datos: ComunicacionCreatePersonal,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*PERSONAL_ROLES)),
):
    alumno = db.query(Alumno).filter(Alumno.id_alumno == datos.id_alumno).first()
    apoderado = db.query(Apoderado).filter(Apoderado.id_apoderado == datos.id_apoderado).first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    if not apoderado:
        raise HTTPException(status_code=404, detail="Apoderado no encontrado")
    _validar_alumno_apoderado(db, datos.id_alumno, datos.id_apoderado)

    comunicacion = Comunicacion(
        id_alumno=datos.id_alumno,
        id_apoderado=datos.id_apoderado,
        asunto=_texto_obligatorio(datos.asunto, "El asunto"),
        estado="respondida",
        creado_por_usuario_id=current_user.id_usuario,
    )
    db.add(comunicacion)
    db.flush()
    _agregar_mensaje(db, comunicacion, current_user.id_usuario, datos.mensaje)
    db.commit()
    db.refresh(comunicacion)
    return _comunicacion_out(comunicacion)


@router.get("/comunicaciones/{id_comunicacion}", response_model=ComunicacionOut)
def obtener_comunicacion(
    id_comunicacion: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*PERSONAL_ROLES)),
):
    comunicacion = db.query(Comunicacion).filter(Comunicacion.id_comunicacion == id_comunicacion).first()
    if not comunicacion:
        raise HTTPException(status_code=404, detail="Comunicación no encontrada")
    return _comunicacion_out(comunicacion)


@router.post("/comunicaciones/{id_comunicacion}/mensajes", response_model=ComunicacionOut)
def responder_comunicacion_personal(
    id_comunicacion: int,
    datos: MensajeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*PERSONAL_ROLES)),
):
    comunicacion = db.query(Comunicacion).filter(Comunicacion.id_comunicacion == id_comunicacion).first()
    if not comunicacion:
        raise HTTPException(status_code=404, detail="Comunicación no encontrada")
    _agregar_mensaje(db, comunicacion, current_user.id_usuario, datos.mensaje)
    comunicacion.estado = "respondida"
    db.commit()
    db.refresh(comunicacion)
    return _comunicacion_out(comunicacion)


@router.put("/comunicaciones/{id_comunicacion}/estado", response_model=ComunicacionOut)
def actualizar_estado_comunicacion(
    id_comunicacion: int,
    datos: EstadoUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(*PERSONAL_ROLES)),
):
    if datos.estado not in ESTADOS_COMUNICACION:
        raise HTTPException(status_code=400, detail="Estado de comunicación inválido")
    comunicacion = db.query(Comunicacion).filter(Comunicacion.id_comunicacion == id_comunicacion).first()
    if not comunicacion:
        raise HTTPException(status_code=404, detail="Comunicación no encontrada")
    comunicacion.estado = datos.estado
    db.commit()
    db.refresh(comunicacion)
    return _comunicacion_out(comunicacion)
