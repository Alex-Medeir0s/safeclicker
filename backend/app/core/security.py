"""
Módulo de segurança: autenticação JWT, hashing de senha e dependências de autorização.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from pydantic import BaseModel
import hashlib

# Configurações JWT
SECRET_KEY = "seu-secret-key-aqui-trocar-em-producao"  # TODO: Mover para .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

# Security scheme
security = HTTPBearer()


class TokenData(BaseModel):
    """Dados armazenados no token JWT"""
    user_id: int
    email: str
    role: str
    department_id: Optional[int] = None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha em texto plano corresponde ao hash SHA256"""
    # Converter texto plano para SHA256
    plain_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    return plain_hash == hashed_password


def get_password_hash(password: str) -> str:
    """Gera hash SHA256 da senha (simples mas funcional para desenvolvimento)"""
    # Usar SHA256 em vez de bcrypt para evitar problemas de compatibilidade
    return hashlib.sha256(password.encode()).hexdigest()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria token JWT com os dados do usuário.
    
    Args:
        data: Dicionário com dados do usuário (user_id, email, role, department_id)
        expires_delta: Tempo de expiração customizado
    
    Returns:
        Token JWT codificado
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> TokenData:
    """
    Decodifica e valida token JWT.
    
    Args:
        token: Token JWT
    
    Returns:
        TokenData com informações do usuário
    
    Raises:
        HTTPException: Se token inválido ou expirado
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")
        role: str = payload.get("role")
        department_id: Optional[int] = payload.get("department_id")
        
        if user_id is None or email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return TokenData(
            user_id=user_id,
            email=email,
            role=role,
            department_id=department_id
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependência que retorna o usuário autenticado a partir do token JWT.
    
    Args:
        credentials: Credenciais do header Authorization
        db: Sessão do banco de dados
    
    Returns:
        Usuário autenticado
    
    Raises:
        HTTPException: Se token inválido ou usuário não encontrado
    """
    token = credentials.credentials
    token_data = decode_access_token(token)
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependência que garante que o usuário está ativo"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    return current_user


def require_role(*allowed_roles: UserRole):
    """
    Decorador que restringe acesso a endpoints baseado em roles.
    
    Uso:
        @router.get("/admin-only")
        async def admin_endpoint(user: User = Depends(require_role(UserRole.TI))):
            ...
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Roles permitidas: {[r.value for r in allowed_roles]}"
            )
        return current_user
    
    return role_checker
