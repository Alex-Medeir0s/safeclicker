from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.access_control import apply_scope, check_resource_access
from app.models.campaign import Campaign
from app.models.campaign_send import CampaignSend
from app.models.click_event import ClickEvent
from app.models.training_completion import TrainingCompletion
from app.models.user import User
from app.schemas.campaign import CampaignCreate, CampaignRead, CampaignUpdate
from app.services.campaign_scheduler import send_campaign_now

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def clear_campaign_generated_data(db: Session, campaign_id: int):
    """Remove envios, cliques e treinamentos gerados por uma campanha."""
    send_ids_query = (
        db.query(CampaignSend.id)
        .filter(CampaignSend.campaign_id == campaign_id)
    )

    db.query(TrainingCompletion).filter(
        TrainingCompletion.campaign_send_id.in_(send_ids_query)
    ).delete(synchronize_session=False)

    db.query(ClickEvent).filter(
        ClickEvent.campaign_send_id.in_(send_ids_query)
    ).delete(synchronize_session=False)

    db.query(CampaignSend).filter(
        CampaignSend.campaign_id == campaign_id
    ).delete(synchronize_session=False)


class TrainingCompleteRequest(BaseModel):
    token: str


class TrainingCompleteResponse(BaseModel):
    recorded: bool
    campaign_send_id: int
    completed_at: datetime


@router.get("", response_model=List[CampaignRead])
async def get_campaigns(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar campanhas com filtro por role e departamento"""
    query = db.query(Campaign)
    query = apply_scope(query, Campaign, current_user)
    campaigns = query.offset(skip).limit(limit).all()
    return campaigns


@router.get("/{campaign_id}", response_model=CampaignRead)
async def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Verificar acesso
    if not check_resource_access(campaign, current_user):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    return campaign


@router.post("", response_model=CampaignRead)
async def create_campaign(
    campaign: CampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Criar campanha com validação de departamento"""
    from app.models.user import UserRole
    
    # Validar que target_department_id foi fornecido
    if not campaign.target_department_id:
        raise HTTPException(
            status_code=400,
            detail="É necessário selecionar um departamento alvo para a campanha"
        )
    
    # Determinar department_id baseado na role do usuário
    if current_user.role == UserRole.TI:
        # TI pode criar para qualquer departamento
        # Se não especificou, usar o primeiro departamento disponível
        if not campaign.department_id:
            # Usar o target_department_id como department_id
            department_id = campaign.target_department_id
        else:
            department_id = campaign.department_id
    else:
        # Gestor e Colaborador só podem criar para seu próprio departamento
        if not current_user.department_id:
            raise HTTPException(
                status_code=400,
                detail="Usuário sem departamento não pode criar campanhas"
            )
        department_id = current_user.department_id
    
    # Criar campanha com todos os dados incluindo target_department_id
    campaign_data = campaign.dict()
    campaign_data["department_id"] = department_id
    campaign_data["created_by"] = current_user.id
    if campaign_data.get("start_date"):
        campaign_data["status"] = "scheduled"
    else:
        campaign_data["status"] = campaign_data.get("status") or "draft"
    
    new_campaign = Campaign(**campaign_data)
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    return new_campaign


@router.put("/{campaign_id}", response_model=CampaignRead)
async def update_campaign(
    campaign_id: int,
    campaign_update: CampaignUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Verificar acesso
    if not check_resource_access(campaign, current_user):
        raise HTTPException(status_code=403, detail="Acesso negado")

    try:
        # Ao atualizar a campanha, limpa os dados gerados previamente.
        clear_campaign_generated_data(db, campaign.id)

        for key, value in campaign_update.dict(exclude_unset=True).items():
            setattr(campaign, key, value)

        if campaign.status != "disabled":
            if campaign.start_date and campaign.status in {"draft", "scheduled"}:
                campaign.status = "scheduled"
            elif not campaign.start_date and campaign.status == "scheduled":
                campaign.status = "draft"

        db.commit()
        db.refresh(campaign)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao atualizar campanha")

    return campaign


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Verificar acesso
    if not check_resource_access(campaign, current_user):
        raise HTTPException(status_code=403, detail="Acesso negado")

    try:
        clear_campaign_generated_data(db, campaign.id)
        db.delete(campaign)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao excluir campanha")

    return {"message": "Campaign deleted"}


@router.post("/{campaign_id}/deactivate")
async def deactivate_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    if not check_resource_access(campaign, current_user):
        raise HTTPException(status_code=403, detail="Acesso negado")

    try:
        campaign.status = "disabled"
        db.commit()
        db.refresh(campaign)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao desativar campanha")

    return {
        "campaign_id": campaign.id,
        "status": campaign.status,
        "message": "Campanha desativada"
    }


@router.post("/{campaign_id}/send")
async def send_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    # Verificar acesso
    if not check_resource_access(campaign, current_user):
        raise HTTPException(status_code=403, detail="Acesso negado")

    if campaign.status == "disabled":
        raise HTTPException(status_code=400, detail="Campanha desativada não pode ser enviada")

    if not campaign.target_department_id:
        raise HTTPException(status_code=400, detail="Campanha sem departamento alvo definido")

    if not campaign.html_template:
        raise HTTPException(status_code=400, detail="Campanha sem template HTML configurado")
    return await send_campaign_now(db, campaign)


@router.get("/track/{token}", include_in_schema=False)
def track_click(token: str, request: Request, db: Session = Depends(get_db)):
    row = db.query(CampaignSend).filter(CampaignSend.token == token).first()
    if not row:
        raise HTTPException(status_code=404, detail="Token inválido")

    if row.campaign and row.campaign.status == "disabled":
        frontend = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
        return RedirectResponse(url=f"{frontend}/click-alert?token={token}")

    # Marca como aberto
    if not row.opened:
        row.opened = True
        row.opened_at = datetime.utcnow()

    # Registra somente o primeiro clique por envio
    existing_click = (
        db.query(ClickEvent)
        .filter(ClickEvent.campaign_send_id == row.id)
        .first()
    )

    if not existing_click:
        click_event = ClickEvent(
            campaign_send_id=row.id,
            link_url=str(request.url),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent", ""),
        )
        db.add(click_event)

    db.commit()

    frontend = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return RedirectResponse(url=f"{frontend}/click-alert?token={token}")


@router.post("/training/complete", response_model=TrainingCompleteResponse)
def complete_training(
    payload: TrainingCompleteRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    token = (payload.token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Token é obrigatório")

    send_row = db.query(CampaignSend).filter(CampaignSend.token == token).first()
    if not send_row:
        raise HTTPException(status_code=404, detail="Token inválido")

    if send_row.campaign and send_row.campaign.status == "disabled":
        raise HTTPException(status_code=400, detail="Campanha desativada não registra treinamento")

    existing_completion = (
        db.query(TrainingCompletion)
        .filter(TrainingCompletion.campaign_send_id == send_row.id)
        .first()
    )

    if existing_completion:
        return TrainingCompleteResponse(
            recorded=False,
            campaign_send_id=send_row.id,
            completed_at=existing_completion.completed_at,
        )

    completion = TrainingCompletion(
        campaign_send_id=send_row.id,
        completed_at=datetime.utcnow(),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", ""),
    )
    try:
        db.add(completion)
        db.commit()
        db.refresh(completion)
    except IntegrityError:
        db.rollback()
        existing_completion = (
            db.query(TrainingCompletion)
            .filter(TrainingCompletion.campaign_send_id == send_row.id)
            .first()
        )
        if existing_completion:
            return TrainingCompleteResponse(
                recorded=False,
                campaign_send_id=send_row.id,
                completed_at=existing_completion.completed_at,
            )
        raise HTTPException(status_code=500, detail="Erro ao registrar conclusão")

    return TrainingCompleteResponse(
        recorded=True,
        campaign_send_id=send_row.id,
        completed_at=completion.completed_at,
    )

