from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.security import verify_password, create_access_token
from backend.models.usuario import Usuario

router = APIRouter()

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
