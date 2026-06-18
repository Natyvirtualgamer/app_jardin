from fastapi import APIRouter, Depends
from backend.core.deps import get_current_user

router = APIRouter()

@router.get("/")
def listar_pagos(current_user=Depends(get_current_user)):
    return {"module": "pagos", "status": "ok", "items": []}
