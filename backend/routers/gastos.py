from fastapi import APIRouter, Depends
from backend.core.deps import require_roles

router = APIRouter()

@router.get("/")
def listar_gastos(current_user=Depends(require_roles("administrador", "direccion", "finanzas"))):
    return {"module": "gastos", "status": "ok", "items": []}
