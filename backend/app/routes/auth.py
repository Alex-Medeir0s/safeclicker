from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.user import User
from app.core.security import verify_password, create_access_token, get_current_user
from typing import Optional
from fastapi import Depends
import hashlib

router = APIRouter(prefix="/auth", tags=["auth"])


def simple_hash(password: str) -> str:
    """Hash simples SHA256 - TEMPORÁRIO PARA TESTES"""
    return hashlib.sha256(password.encode()).hexdigest()


def simple_verify(plain_password: str, hashed_password: str) -> bool:
    """Verifica senha com SHA256 - TEMPORÁRIO PARA TESTES"""
    return simple_hash(plain_password) == hashed_password


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    department_id: Optional[int] = None
    is_active: bool
    token: str


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login endpoint - retorna token JWT com role e department_id"""
    # Normaliza o email para evitar erro de maiúsculas/minúsculas ou espaços
    email_normalized = request.email.strip().lower()
    print(f"DEBUG: Login attempt for email: {request.email} (normalized: {email_normalized})")
    user = (
        db.query(User)
        .filter(func.lower(User.email) == email_normalized)
        .first()
    )
    
    if not user:
        print(f"DEBUG: User not found for: {email_normalized}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    print(f"DEBUG: User found: {user.email}, stored_hash: {user.hashed_password[:20]}..., password length: {len(request.password)}")
    
    # Validação de senha - detecta tipo de hash
    password_valid = False
    
    # Verifica se é hash SHA256 (64 caracteres hex) ou bcrypt (começa com $2b$)
    if len(user.hashed_password) == 64 and all(c in '0123456789abcdef' for c in user.hashed_password):
        # Hash SHA256 - para usuários de teste
        print(f"DEBUG: Checking SHA256 hash")
        password_valid = simple_verify(request.password, user.hashed_password)
        print(f"DEBUG: SHA256 result: {password_valid}")
    else:
        # Tenta bcrypt (para usuários antigos)
        try:
            print(f"DEBUG: Checking bcrypt hash")
            password_valid = verify_password(request.password, user.hashed_password)
            print(f"DEBUG: bcrypt result: {password_valid}")
        except Exception as e:
            print(f"Erro ao verificar senha bcrypt: {e}")
            password_valid = False
    
    if not password_valid:
        print(f"DEBUG: Password validation failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    
    # Criar token JWT com dados do usuário
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "email": user.email,
            "role": user.role.value if user.role else "COLABORADOR",
            "department_id": user.department_id
        }
    )
    
    return LoginResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value if user.role else "COLABORADOR",
        department_id=user.department_id,
        is_active=user.is_active,
        token=access_token
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
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info from JWT"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value if current_user.role else "COLABORADOR",
        "department_id": current_user.department_id,
        "is_active": current_user.is_active
    }
