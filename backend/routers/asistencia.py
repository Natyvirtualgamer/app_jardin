from fastapi import APIRouter, Depends
from backend.core.deps import get_current_user

router = APIRouter()

@router.get("/")
def listar_asistencia(current_user=Depends(get_current_user)):
    return {"module": "asistencia", "status": "ok", "items": []}
