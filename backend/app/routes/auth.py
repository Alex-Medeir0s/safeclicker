from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from typing import Optional
from fastapi import Depends

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    token: str = "fake-jwt-token"  # Implementar JWT depois


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login endpoint - retorna token de autenticação"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    # Validação simples de senha (implementar bcrypt depois)
    if user.hashed_password != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    
    return LoginResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        token="fake-jwt-token"
    )


@router.post("/register")
async def register(request: LoginRequest, db: Session = Depends(get_db)):
    """Registrar novo usuário"""
    existing_user = db.query(User).filter(User.email == request.email).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já registrado"
        )
    
    new_user = User(
        email=request.email,
        full_name=request.email.split("@")[0],
        hashed_password=request.password,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "message": "Usuário registrado com sucesso"
    }


@router.get("/me")
async def get_current_user(db: Session = Depends(get_db)):
    """Get current user info"""
    # Implementar JWT validation depois
    users = db.query(User).first()
    if not users:
        raise HTTPException(status_code=401, detail="Não autenticado")
    
    return {
        "id": users.id,
        "email": users.email,
        "full_name": users.full_name
    }
