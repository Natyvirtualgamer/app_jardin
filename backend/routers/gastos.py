from fastapi import APIRouter, Depends
from backend.core.deps import get_current_user

router = APIRouter()

@router.get("/")
def listar_gastos(current_user=Depends(get_current_user)):
    return {"module": "gastos", "status": "ok", "items": []}
