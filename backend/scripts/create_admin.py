#!/usr/bin/env python3
"""
create_admin.py
Crea la institucion por defecto, los roles del sistema y el primer
usuario administrador. Se ejecuta UNA SOLA VEZ despues del primer deploy,
en EC2-A o EC2-B (da igual cual, ambas comparten la misma RDS).

ADMIN_PASSWORD es OBLIGATORIA (no hay default debil). El script termina
con un mensaje claro si no se define.

Uso (invocar como MODULO, no como script suelto):
    docker compose exec \\
        -e ADMIN_EMAIL=admin@appjardin.cl \\
        -e ADMIN_PASSWORD='UnaClaveSegura2026!' \\
        backend python -m backend.scripts.create_admin

NOTA: "python scripts/create_admin.py" (script suelto) tambien funciona
porque el archivo inserta /app en sys.path manualmente, pero "-m" es la
forma robusta y recomendada: no depende del directorio de trabajo desde
el que se ejecute "docker compose exec".
"""

import os
import sys

# Asegurar que el path incluye la raiz del proyecto (solo necesario si
# se invoca como script suelto, p.ej. "python scripts/create_admin.py";
# con "python -m backend.scripts.create_admin" ya es redundante porque
# PYTHONPATH=/app viene seteado en el Dockerfile).
sys.path.insert(0, "/app")

from sqlalchemy.orm import Session
from backend.core.database import SessionLocal, engine, Base
from backend.core.security import get_password_hash

# Importar TODOS los modelos (paquete completo) para que Base.metadata
# quede completo antes de create_all. Si solo se importa "usuario", las
# tablas curso/asistencia/gasto/pago jamas se crean y la app falla en RDS.
from backend import models  # noqa: F401
from backend.models.usuario import Rol, Usuario
from backend.models.institucion import Institucion

# ── Configuracion ──────────────────────────────────────────────────────────
# Valores por defecto que pueden ser sobreescritos por variables de entorno
DEFAULT_CONFIG = {
    "ADMIN_EMAIL": "admin@appjardin.cl",
    "ADMIN_NOMBRE": "Administrador",
    "ADMIN_APELLIDO": "Sistema",
    "ADMIN_RUT": "11111111-1",
    "INSTITUCION_NOMBRE": "Jardin Infantil Default",
}

# La contraseña es obligatoria y no tiene default.
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# Cargar configuración, dando prioridad a las variables de entorno
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", DEFAULT_CONFIG["ADMIN_EMAIL"])
ADMIN_NOMBRE = os.getenv("ADMIN_NOMBRE", DEFAULT_CONFIG["ADMIN_NOMBRE"])
ADMIN_APELLIDO = os.getenv("ADMIN_APELLIDO", DEFAULT_CONFIG["ADMIN_APELLIDO"])
ADMIN_RUT = os.getenv("ADMIN_RUT", DEFAULT_CONFIG["ADMIN_RUT"])
INSTITUCION_NOMBRE = os.getenv(
    "INSTITUCION_NOMBRE", DEFAULT_CONFIG["INSTITUCION_NOMBRE"]
)

# ── Roles del sistema ────────────────────────────────────────────────────
ROLES = [
    {"nombre": "administrador", "descripcion": "Acceso completo al sistema"},
    {"nombre": "direccion", "descripcion": "Acceso a reportes y gestion general"},
    {
        "nombre": "educadora",
        "descripcion": "Registro de asistencia, comunicados y minutas",
    },
    {"nombre": "finanzas", "descripcion": "Gestion de pagos, mensualidades y gastos"},
    {"nombre": "recepcion", "descripcion": "Matricula y registro de alumnos"},
    {"nombre": "apoderado", "descripcion": "Acceso al portal de apoderados"},
]

# Passwords que NO se aceptan aunque cumplan largo minimo
_PASSWORDS_DEBILES = {"admin123!", "password", "12345678", "changeme", "admin1234"}


def exigir_admin_password() -> None:
    """ADMIN_PASSWORD es obligatoria — sin default debil. Termina con
    mensaje claro si no fue definida, en vez de fallar mas adelante con
    un error críptico de password debil sobre un default inventado."""
    if not ADMIN_PASSWORD:
        print("ERROR: la variable de entorno ADMIN_PASSWORD es obligatoria.")
        print()
        print("Ejecutar asi:")
        print("  docker compose exec \\")
        print("    -e ADMIN_EMAIL=admin@appjardin.cl \\")
        print("    -e ADMIN_PASSWORD='UnaClaveSegura2026!' \\")
        print("    backend python -m backend.scripts.create_admin")
        sys.exit(1)


def validar_password(password: str) -> None:
    """Rechaza contrasenas debiles. No se ejecuta nada si falla — sys.exit(1)."""
    if len(password) < 8:
        print("ERROR: ADMIN_PASSWORD debe tener al menos 8 caracteres.")
        sys.exit(1)
    tiene_letra = any(c.isalpha() for c in password)
    tiene_numero = any(c.isdigit() for c in password)
    if not (tiene_letra and tiene_numero):
        print("ERROR: ADMIN_PASSWORD debe combinar letras y numeros.")
        sys.exit(1)
    if password.lower() in _PASSWORDS_DEBILES:
        print("ERROR: ADMIN_PASSWORD es una contrasena debil conocida. Usa otra.")
        sys.exit(1)


def enmascarar(password: str) -> str:
    """Nunca imprimir la contrasena completa en logs."""
    if len(password) <= 4:
        return "*" * len(password)
    return password[:2] + "*" * (len(password) - 4) + password[-2:]


def crear_tablas():
    """Crea TODAS las tablas registradas en Base.metadata (idempotente).

    Antes este paso creaba solo Rol y Usuario tabla por tabla, lo que
    fallaba en Postgres/RDS porque usuario.id_institucion referencia
    institucion.id_institucion y esa tabla nunca llegaba a existir.
    """
    print("Verificando tablas (Base.metadata.create_all)...")
    Base.metadata.create_all(bind=engine, checkfirst=True)
    print("  Tablas OK")


def crear_institucion_default(db: Session) -> Institucion:
    """Crea la institucion por defecto si no existe (idempotente).

    Alumno, Curso y Gasto tienen id_institucion NOT NULL, asi que el
    sistema necesita al menos una institucion para ser usable.
    """
    print(f"\nVerificando institucion por defecto ({INSTITUCION_NOMBRE})...")
    existente = (
        db.query(Institucion).filter(Institucion.nombre == INSTITUCION_NOMBRE).first()
    )
    if existente:
        print(
            f"  Institucion '{INSTITUCION_NOMBRE}' ya existe (id={existente.id_institucion}) — omitiendo"
        )
        return existente

    institucion = Institucion(nombre=INSTITUCION_NOMBRE)
    db.add(institucion)
    db.flush()  # obtener id_institucion generado
    db.commit()
    print(
        f"  Institucion '{INSTITUCION_NOMBRE}' creada (id={institucion.id_institucion})"
    )
    return institucion


def crear_roles(db: Session) -> dict:
    """Crea los roles si no existen. Retorna dict nombre→Rol."""
    print("\nCreando roles...")
    roles_creados = {}

    for rol_data in ROLES:
        existente = db.query(Rol).filter(Rol.nombre == rol_data["nombre"]).first()
        if existente:
            print(f"  Rol '{rol_data['nombre']}' ya existe — omitiendo")
            roles_creados[rol_data["nombre"]] = existente
        else:
            nuevo_rol = Rol(**rol_data)
            db.add(nuevo_rol)
            db.flush()  # para obtener el id_rol generado
            roles_creados[rol_data["nombre"]] = nuevo_rol
            print(f"  Rol '{rol_data['nombre']}' creado")

    db.commit()
    return roles_creados


def crear_admin(db: Session, rol_admin: Rol, institucion: Institucion):
    """Crea el usuario administrador si no existe."""
    print(f"\nCreando usuario administrador ({ADMIN_EMAIL})...")

    existente = db.query(Usuario).filter(Usuario.email == ADMIN_EMAIL).first()
    if existente:
        print(f"  El usuario '{ADMIN_EMAIL}' ya existe — omitiendo")
        return existente

    admin = Usuario(
        id_rol=rol_admin.id_rol,
        id_institucion=institucion.id_institucion,
        nombre=ADMIN_NOMBRE,
        apellido=ADMIN_APELLIDO,
        rut=ADMIN_RUT,
        email=ADMIN_EMAIL,
        hashed_password=get_password_hash(ADMIN_PASSWORD),
        activo=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"  Usuario administrador creado con ID: {admin.id_usuario}")
    return admin


def main():
    print("=" * 55)
    print("  Inicializacion del Sistema Gestion Preescolar")
    print("=" * 55)

    exigir_admin_password()
    validar_password(ADMIN_PASSWORD)

    # 1. Crear todas las tablas
    crear_tablas()

    # 2. Abrir sesion de BD
    db = SessionLocal()
    try:
        # 3. Institucion por defecto (requerida por FKs NOT NULL)
        institucion = crear_institucion_default(db)

        # 4. Roles
        roles = crear_roles(db)

        # 5. Usuario administrador
        rol_admin = roles.get("administrador")
        if not rol_admin:
            print("ERROR: No se pudo crear el rol administrador")
            sys.exit(1)

        crear_admin(db, rol_admin, institucion)

        # 6. Resumen (password enmascarada — nunca se imprime completa)
        print("\n" + "=" * 55)
        print("  Inicializacion completada exitosamente")
        print("=" * 55)
        print(f"  Email:      {ADMIN_EMAIL}")
        print(f"  Password:   {enmascarar(ADMIN_PASSWORD)}  (oculta por seguridad)")
        print(f"  Rol:        administrador")
        print("=" * 55)
        print("\n  IMPORTANTE: Cambia la contrasena despues del")
        print("  primer login en produccion.")
        print()

    except Exception as e:
        db.rollback()
        print(f"\nERROR: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
