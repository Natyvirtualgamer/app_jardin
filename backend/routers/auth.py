import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.core.database import get_db
from backend.core.deps import get_current_user, require_roles
from backend.core.security import verify_password, create_access_token, get_password_hash
from backend.models.usuario import Rol, Usuario
from backend.models.institucion import Institucion
from backend.models.educadora import Educadora

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(
        Usuario.email == form_data.username,
        Usuario.activo == True
    ).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )
    token_data = {"sub": str(user.id_usuario), "rol": user.rol.nombre}
    access_token = create_access_token(data=token_data)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "rol": user.rol.nombre,
        "nombre": f"{user.nombre} {user.apellido}",
    }


@router.get("/me")
def get_me(db: Session = Depends(get_db)):
    return {"message": "Endpoint /me — requiere token válido"}


class RegistroApoderadoIn(BaseModel):
    nombre: str
    apellido: str
    rut: str
    email: str
    password: str


@router.post("/registro", status_code=201)
def registro_apoderado(datos: RegistroApoderadoIn, db: Session = Depends(get_db)):
    """Autorregistro — SOLO crea cuentas con rol 'apoderado'. El personal del
    jardin (administrador, educadora, etc.) se crea por el admin via
    backend/scripts/create_admin.py o un endpoint administrativo, nunca por
    autorregistro publico (evita que cualquiera se cree una cuenta de staff)."""
    if len(datos.password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    if db.query(Usuario).filter(Usuario.email == datos.email).first():
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo")

    rol_apoderado = db.query(Rol).filter(Rol.nombre == "apoderado").first()
    if not rol_apoderado:
        raise HTTPException(status_code=500, detail="El rol 'apoderado' no está configurado en el sistema")
    institucion = db.query(Institucion).first()
    if not institucion:
        raise HTTPException(status_code=500, detail="No hay una institución configurada en el sistema")

    nuevo = Usuario(
        id_rol=rol_apoderado.id_rol,
        id_institucion=institucion.id_institucion,
        nombre=datos.nombre,
        apellido=datos.apellido,
        rut=datos.rut,
        email=datos.email,
        hashed_password=get_password_hash(datos.password),
        activo=True,
    )
    db.add(nuevo)
    db.commit()
    return {"message": "Cuenta creada correctamente. Ya puedes iniciar sesión."}


class RecuperarIn(BaseModel):
    email: str


@router.post("/recuperar")
def recuperar_password(datos: RecuperarIn, db: Session = Depends(get_db)):
    """No hay proveedor SMTP configurado en este MVP (Academy no incluye SES).
    No se confirma ni se niega si el correo existe (evita enumeracion de
    cuentas). La solicitud se registra en el log para seguimiento manual del
    administrador; reemplazar por envio real de correo en produccion."""
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if usuario:
        logger.info("Solicitud de recuperación de contraseña — usuario id=%s email=%s", usuario.id_usuario, usuario.email)
    return {"message": "Si el correo está registrado, el administrador procesará tu solicitud a la brevedad."}


# ── Gestión de usuarios (solo administrador) ─────────────────────────
# A proposito NO se agrega ninguna columna nueva a Usuario: este proyecto
# no usa Alembic (solo Base.metadata.create_all, que no altera tablas ya
# existentes en RDS). El reset solo pisa hashed_password, que ya existe.

class UsuarioOut(BaseModel):
    id_usuario: int
    nombre: str
    apellido: str
    rut: str
    email: str
    rol: str
    activo: bool


class RolOut(BaseModel):
    id_rol: int
    nombre: str
    descripcion: str | None = None


@router.get("/usuarios", response_model=List[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db), current_user=Depends(require_roles("administrador"))):
    usuarios = db.query(Usuario).order_by(Usuario.id_usuario).all()
    return [
        UsuarioOut(
            id_usuario=u.id_usuario, nombre=u.nombre, apellido=u.apellido,
            rut=u.rut, email=u.email, rol=u.rol.nombre, activo=u.activo,
        )
        for u in usuarios
    ]


@router.get("/roles", response_model=List[RolOut])
def listar_roles(db: Session = Depends(get_db), current_user=Depends(require_roles("administrador"))):
    return db.query(Rol).order_by(Rol.nombre).all()


class UsuarioCreate(BaseModel):
    nombre: str
    apellido: str
    rut: str
    email: str
    rol: str
    password: str


class UsuarioUpdate(BaseModel):
    nombre: str
    apellido: str
    rut: str
    email: str
    rol: str
    activo: bool = True


def _rol_por_nombre(db: Session, nombre: str) -> Rol:
    rol = db.query(Rol).filter(Rol.nombre == nombre).first()
    if not rol:
        raise HTTPException(status_code=400, detail="Rol no configurado en el sistema")
    return rol


def _institucion_default(db: Session) -> Institucion:
    institucion = db.query(Institucion).first()
    if not institucion:
        raise HTTPException(status_code=500, detail="No hay una institución configurada en el sistema")
    return institucion


def _asegurar_ficha_educadora(db: Session, usuario: Usuario, rol_nombre: str) -> None:
    if rol_nombre != "educadora":
        return
    existe = db.query(Educadora).filter(Educadora.id_usuario == usuario.id_usuario).first()
    if not existe:
        db.add(Educadora(id_usuario=usuario.id_usuario))


@router.post("/usuarios", response_model=UsuarioOut, status_code=201)
def crear_usuario(
    datos: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("administrador")),
):
    if len(datos.password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    if db.query(Usuario).filter(Usuario.email == datos.email).first():
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese correo")
    if db.query(Usuario).filter(Usuario.rut == datos.rut).first():
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese RUT")

    rol = _rol_por_nombre(db, datos.rol)
    institucion = _institucion_default(db)
    usuario = Usuario(
        id_rol=rol.id_rol,
        id_institucion=institucion.id_institucion,
        nombre=datos.nombre,
        apellido=datos.apellido,
        rut=datos.rut,
        email=datos.email,
        hashed_password=get_password_hash(datos.password),
        activo=True,
    )
    db.add(usuario)
    db.flush()
    _asegurar_ficha_educadora(db, usuario, rol.nombre)
    db.commit()
    db.refresh(usuario)
    return UsuarioOut(
        id_usuario=usuario.id_usuario, nombre=usuario.nombre, apellido=usuario.apellido,
        rut=usuario.rut, email=usuario.email, rol=usuario.rol.nombre, activo=usuario.activo,
    )


@router.put("/usuarios/{id_usuario}", response_model=UsuarioOut)
def actualizar_usuario(
    id_usuario: int,
    datos: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("administrador")),
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    email_duplicado = db.query(Usuario).filter(Usuario.email == datos.email, Usuario.id_usuario != id_usuario).first()
    if email_duplicado:
        raise HTTPException(status_code=400, detail="Ya existe otra cuenta con ese correo")
    rut_duplicado = db.query(Usuario).filter(Usuario.rut == datos.rut, Usuario.id_usuario != id_usuario).first()
    if rut_duplicado:
        raise HTTPException(status_code=400, detail="Ya existe otra cuenta con ese RUT")

    rol = _rol_por_nombre(db, datos.rol)
    usuario.id_rol = rol.id_rol
    usuario.nombre = datos.nombre
    usuario.apellido = datos.apellido
    usuario.rut = datos.rut
    usuario.email = datos.email
    usuario.activo = datos.activo
    _asegurar_ficha_educadora(db, usuario, rol.nombre)
    db.commit()
    db.refresh(usuario)
    return UsuarioOut(
        id_usuario=usuario.id_usuario, nombre=usuario.nombre, apellido=usuario.apellido,
        rut=usuario.rut, email=usuario.email, rol=usuario.rol.nombre, activo=usuario.activo,
    )


@router.delete("/usuarios/{id_usuario}", status_code=204)
def desactivar_usuario(
    id_usuario: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("administrador")),
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.activo = False
    db.commit()


class EducadoraOut(BaseModel):
    id_educadora: int
    nombre: str
    apellido: str
    email: str
    activo: bool


@router.get("/educadoras", response_model=List[EducadoraOut])
def listar_educadoras(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    filas = (
        db.query(Educadora, Usuario)
        .join(Usuario, Educadora.id_usuario == Usuario.id_usuario)
        .filter(Usuario.activo == True)
        .order_by(Usuario.apellido, Usuario.nombre)
        .all()
    )
    return [
        EducadoraOut(
            id_educadora=e.id_educadora,
            nombre=u.nombre,
            apellido=u.apellido,
            email=u.email,
            activo=u.activo,
        )
        for e, u in filas
    ]


class ResetearPasswordIn(BaseModel):
    nueva_password: str


@router.post("/usuarios/{id_usuario}/resetear-password")
def resetear_password(
    id_usuario: int,
    datos: ResetearPasswordIn,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("administrador")),
):
    if len(datos.nueva_password) < 8:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 8 caracteres")
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.hashed_password = get_password_hash(datos.nueva_password)
    db.commit()
    logger.info("Password reseteada por admin id=%s para usuario id=%s", current_user.id_usuario, usuario.id_usuario)
    return {"message": f"Contraseña restablecida para {usuario.email}"}
