from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash
from app.core.access_control import apply_scope, check_resource_access
from app.models.user import User, UserRole
from app.models.campaign import Campaign
from app.models.campaign_send import CampaignSend
from app.models.click_event import ClickEvent
from app.schemas.user import UserCreate, UserRead, UserUpdate
from typing import List
import csv
import io
from fastapi.responses import StreamingResponse
from fastapi import UploadFile, File
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/users", tags=["users"])


def ensure_user_management_permission(current_user: User):
    if current_user.role != UserRole.TI:
        raise HTTPException(
            status_code=403,
            detail="Apenas usuários TI podem gerenciar usuários"
        )


@router.get("", response_model=List[UserRead])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar usuários com filtro por role e departamento"""
    query = db.query(User).options(joinedload(User.department))
    query = apply_scope(query, User, current_user)
    users = query.offset(skip).limit(limit).all()
    
    # Adicionar department_name aos usuários
    result = []
    for user in users:
        user_dict = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "department_id": user.department_id,
            "department_name": user.department.name if user.department else None,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }
        result.append(user_dict)
    
    return result


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).options(joinedload(User.department)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verificar acesso
    if not check_resource_access(user, current_user):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Retornar com department_name
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "department_id": user.department_id,
        "department_name": user.department.name if user.department else None,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }


@router.post("", response_model=UserRead)
async def create_user(
    user: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Criar usuário com validação de role e departamento"""
    ensure_user_management_permission(current_user)

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
    
    # Carregar department para retornar department_name
    if new_user.department_id:
        db.refresh(new_user, ["department"])
    
    return {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role,
        "department_id": new_user.department_id,
        "department_name": new_user.department.name if new_user.department else None,
        "is_active": new_user.is_active,
        "created_at": new_user.created_at,
        "updated_at": new_user.updated_at
    }


@router.put("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ensure_user_management_permission(current_user)

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
    
    # Carregar department para retornar department_name
    if user.department_id:
        db.refresh(user, ["department"])
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "department_id": user.department_id,
        "department_name": user.department.name if user.department else None,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ensure_user_management_permission(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verificar acesso
    if not check_resource_access(user, current_user):
        raise HTTPException(status_code=403, detail="Acesso negado")

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Não é permitido excluir o próprio usuário"
        )

    campaigns_count = db.query(Campaign).filter(Campaign.created_by == user.id).count()
    sends_count = db.query(CampaignSend).filter(CampaignSend.user_id == user.id).count()

    if campaigns_count > 0:
        raise HTTPException(
            status_code=409,
            detail=(
                "Usuário possui vínculos e não pode ser excluído. "
                f"Campanhas criadas: {campaigns_count}."
            )
        )
    
    try:
        if sends_count > 0:
            send_ids = [send_id for (send_id,) in db.query(CampaignSend.id).filter(CampaignSend.user_id == user.id).all()]
            if send_ids:
                db.query(ClickEvent).filter(ClickEvent.campaign_send_id.in_(send_ids)).delete(synchronize_session=False)
            db.query(CampaignSend).filter(CampaignSend.user_id == user.id).delete(synchronize_session=False)

        db.delete(user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Usuário possui vínculos em outros registros e não pode ser excluído"
        )

    return {"message": "User deleted"}


@router.get("/template/download")
async def download_template(current_user: User = Depends(get_current_user)):
    """Baixar template CSV para importação de usuários"""
    ensure_user_management_permission(current_user)

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Escrever header
    writer.writerow(["full_name", "email", "password", "profile", "department_id"])
    
    # Escrever exemplos
    writer.writerow(["Maria Santos", "maria@example.com", "senha456", "GESTOR", "2"])
    writer.writerow(["Admin TI", "admin@example.com", "senha789", "TI", ""])
    
    output.seek(0)
    
    csv_content = "\ufeff" + output.getvalue()

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": "attachment; filename=usuarios_template.csv",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        }
    )


@router.post("/import/csv")
async def import_users_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Importar usuários via arquivo CSV"""
    ensure_user_management_permission(current_user)

    try:
        contents = await file.read()
        text = contents.decode('utf-8')
        
        reader = csv.DictReader(io.StringIO(text))
        
        created = 0
        total = 0
        errors = []
        
        for line_num, row in enumerate(reader, start=2):  # start=2 porque linha 1 é header
            total += 1
            
            try:
                # Validar campos obrigatórios
                if not row.get("email") or not row.get("email").strip():
                    errors.append({
                        "line": line_num,
                        "email": row.get("email", "?"),
                        "error": "Email é obrigatório"
                    })
                    continue
                
                if not row.get("password") or not row.get("password").strip():
                    errors.append({
                        "line": line_num,
                        "email": row.get("email"),
                        "error": "Password é obrigatório"
                    })
                    continue
                
                profile_value = (row.get("profile") or row.get("role") or "").strip()
                if not profile_value:
                    errors.append({
                        "line": line_num,
                        "email": row.get("email"),
                        "error": "Profile é obrigatório"
                    })
                    continue
                
                profile_map = {
                    "colaborador": "COLABORADOR",
                    "gestor": "GESTOR",
                    "ti": "TI",
                }
                role = profile_map.get(profile_value.lower())
                if not role:
                    errors.append({
                        "line": line_num,
                        "email": row.get("email"),
                        "error": f"Profile inválido: {profile_value}. Use COLABORADOR, GESTOR ou TI"
                    })
                    continue
                
                # Validar department_id para COLABORADOR e GESTOR
                department_id = None
                if role in ["COLABORADOR", "GESTOR"]:
                    dept_str = row.get("department_id", "").strip()
                    if not dept_str:
                        errors.append({
                            "line": line_num,
                            "email": row.get("email"),
                            "error": f"department_id é obrigatório para profile {role}"
                        })
                        continue
                    
                    try:
                        department_id = int(dept_str)
                    except ValueError:
                        errors.append({
                            "line": line_num,
                            "email": row.get("email"),
                            "error": f"department_id inválido: {dept_str}"
                        })
                        continue
                
                # Verificar se email já existe
                existing = db.query(User).filter(User.email == row.get("email").strip()).first()
                if existing:
                    errors.append({
                        "line": line_num,
                        "email": row.get("email"),
                        "error": "Email já cadastrado"
                    })
                    continue
                
                # Criar novo usuário
                new_user = User(
                    full_name=row.get("full_name", "").strip() or row.get("email").strip().split("@")[0],
                    email=row.get("email").strip(),
                    hashed_password=get_password_hash(row.get("password")),
                    role=UserRole[role],
                    department_id=department_id
                )
                
                db.add(new_user)
                db.commit()
                created += 1
                
            except Exception as e:
                errors.append({
                    "line": line_num,
                    "email": row.get("email", "?"),
                    "error": str(e)
                })
                continue
        
        return {
            "total": total,
            "created": created,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar arquivo: {str(e)}")

