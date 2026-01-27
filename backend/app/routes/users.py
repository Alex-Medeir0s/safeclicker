from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash
from app.core.access_control import apply_scope, check_resource_access
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserRead, UserUpdate
from typing import List

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserRead])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar usuários com filtro por role e departamento"""
    query = db.query(User)
    query = apply_scope(query, User, current_user)
    users = query.offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verificar acesso
    if not check_resource_access(user, current_user):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    return user


@router.post("", response_model=UserRead)
async def create_user(
    user: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Criar usuário com validação de role e departamento"""
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash da senha
    hashed_password = get_password_hash(user.password)
    
    new_user = User(
        **user.dict(exclude={"password"}),
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verificar acesso
    if not check_resource_access(user, current_user):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    update_data = user_update.dict(exclude_unset=True)
    
    # Validar department_id se role estiver sendo atualizada
    if "role" in update_data and update_data["role"]:
        if update_data["role"].upper() in ["GESTOR", "COLABORADOR"]:
            final_dept = update_data.get("department_id", user.department_id)
            if not final_dept:
                raise HTTPException(
                    status_code=400,
                    detail=f"Role {update_data['role']} requer department_id obrigatório"
                )
    
    # Se a senha foi fornecida, fazer hash
    if "password" in update_data and update_data["password"]:
        user.hashed_password = get_password_hash(update_data.pop("password"))
    else:
        update_data.pop("password", None)
    
    for key, value in update_data.items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verificar acesso
    if not check_resource_access(user, current_user):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

