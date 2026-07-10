import re

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.models.alumno import Apoderado
from backend.models.usuario import Usuario


def normalize_email(email: str | None) -> str:
    return (email or "").strip().lower()


def normalize_rut(rut: str | None) -> str:
    limpio = (rut or "").strip().upper().replace(".", "").replace(" ", "")
    if not limpio:
        return ""

    if "-" in limpio:
        cuerpo, dv = limpio.split("-", 1)
        cuerpo = re.sub(r"\D", "", cuerpo)
        dv = re.sub(r"[^0-9K]", "", dv)
        return f"{cuerpo}-{dv[:1]}" if cuerpo and dv else limpio

    solo = re.sub(r"[^0-9K]", "", limpio)
    if len(solo) > 1:
        return f"{solo[:-1]}-{solo[-1]}"
    return solo


def find_apoderado_by_identity(db: Session, email: str | None, rut: str | None) -> Apoderado | None:
    email_normalizado = normalize_email(email)
    if email_normalizado:
        apoderado = db.query(Apoderado).filter(func.lower(Apoderado.email) == email_normalizado).first()
        if apoderado:
            return apoderado

    rut_normalizado = normalize_rut(rut)
    if rut_normalizado:
        for apoderado in db.query(Apoderado).all():
            if normalize_rut(apoderado.rut) == rut_normalizado:
                return apoderado

    return None


def get_apoderado_for_user(db: Session, usuario: Usuario) -> Apoderado | None:
    return find_apoderado_by_identity(db, usuario.email, usuario.rut)


def get_or_create_apoderado_for_user(db: Session, usuario: Usuario) -> Apoderado:
    email_normalizado = normalize_email(usuario.email)
    rut_normalizado = normalize_rut(usuario.rut)
    apoderado = find_apoderado_by_identity(db, email_normalizado, rut_normalizado)

    if not apoderado:
        apoderado = Apoderado(
            nombres=usuario.nombre,
            apellidos=usuario.apellido,
            rut=rut_normalizado,
            email=email_normalizado,
        )
        db.add(apoderado)
        return apoderado

    apoderado.nombres = usuario.nombre
    apoderado.apellidos = usuario.apellido
    apoderado.rut = rut_normalizado
    apoderado.email = email_normalizado
    return apoderado
