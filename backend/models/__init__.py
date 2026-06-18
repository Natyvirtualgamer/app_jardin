# models/__init__.py
# Importar este paquete registra TODAS las tablas en Base.metadata.
# Sin esto, Base.metadata.create_all() solo crea las tablas de los
# modelos que algun router importa directamente (usuario, alumno) y
# las demas (curso, asistencia, gasto, pago) quedan fuera, rompiendo
# las Foreign Keys en Postgres/RDS con "relation does not exist".
from backend.models.institucion import Institucion  # noqa: F401
from backend.models.educadora import Educadora  # noqa: F401
from backend.models.usuario import Rol, Usuario  # noqa: F401
from backend.models.alumno import Alumno, AlumnoApoderado, Apoderado  # noqa: F401
from backend.models.curso import Curso  # noqa: F401
from backend.models.asistencia import Asistencia  # noqa: F401
from backend.models.gasto import CategoriaGasto, Proveedor, Gasto  # noqa: F401
from backend.models.pago import Mensualidad, Pago  # noqa: F401

__all__ = [
    "Institucion", "Educadora", "Rol", "Usuario",
    "Alumno", "AlumnoApoderado", "Apoderado",
    "Curso", "Asistencia",
    "CategoriaGasto", "Proveedor", "Gasto",
    "Mensualidad", "Pago",
]
