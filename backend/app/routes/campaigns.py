import os
import secrets
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.campaign_send import CampaignSend
from app.models.click_event import ClickEvent
from app.models.user import User
from app.schemas.campaign import CampaignCreate, CampaignRead, CampaignUpdate
from app.services.email_service import email_service

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("", response_model=List[CampaignRead])
async def get_campaigns(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).offset(skip).limit(limit).all()
    return campaigns


@router.get("/{campaign_id}", response_model=CampaignRead)
async def get_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.post("", response_model=CampaignRead)
async def create_campaign(campaign: CampaignCreate, db: Session = Depends(get_db)):
    # Usar ID 1 como usuario padrão (será melhorado com autenticação JWT)
    # Em produção, pegar do token JWT
    created_by = 1
    new_campaign = Campaign(**campaign.dict(), created_by=created_by)
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    return new_campaign


@router.put("/{campaign_id}", response_model=CampaignRead)
async def update_campaign(campaign_id: int, campaign_update: CampaignUpdate, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    for key, value in campaign_update.dict(exclude_unset=True).items():
        setattr(campaign, key, value)
    
    db.commit()
    db.refresh(campaign)
    return campaign


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted"}


@router.post("/{campaign_id}/send")
async def send_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    if not campaign.target_department_id:
        raise HTTPException(status_code=400, detail="Campanha sem departamento alvo definido")

    if not campaign.html_template:
        raise HTTPException(status_code=400, detail="Campanha sem template HTML configurado")

    users = (
        db.query(User)
        .filter(User.department_id == campaign.target_department_id, User.is_active == True)
        .all()
    )

    if not users:
        raise HTTPException(status_code=400, detail="Departamento selecionado sem usuários ativos")

    base_url = os.getenv("APP_BASE_URL", "http://localhost:8000").rstrip("/")

    sent = 0
    errors = []

    # Marcar campanha como ativa para aparecer no dashboard
    campaign.status = "active"
    db.commit()
    db.refresh(campaign)

    for user in users:
        token = secrets.token_urlsafe(24)

        send_row = CampaignSend(
            campaign_id=campaign.id,
            recipient_email=user.email,
            token=token,
            sent_at=datetime.utcnow(),
            opened=False,
            bounced=False,
        )
        db.add(send_row)
        db.commit()
        db.refresh(send_row)

        tracking_url = f"{base_url}/campaigns/track/{token}"
        html = campaign.html_template or ""

        # Substitui variáveis dinâmicas no HTML
        html = (
            html.replace("{{tracking_url}}", tracking_url)
            .replace("{tracking_url}", tracking_url)
            .replace("{link_rastreamento}", tracking_url)
            .replace("{nome}", user.full_name or "")
            .replace("{email}", user.email or "")
        )

        try:
            await email_service.send_html(
                subject=campaign.subject or "Campanha SafeClicker",
                recipients=[user.email],
                html=html,
            )
            sent += 1
        except Exception as exc:  # pragma: no cover - external dependency
            send_row.bounced = True
            db.commit()
            errors.append({"email": user.email, "error": str(exc)})

    return {
        "campaign_id": campaign.id,
        "recipients": len(users),
        "sent": sent,
        "errors": errors,
        "status": campaign.status,
    }


@router.get("/track/{token}", include_in_schema=False)
def track_click(token: str, request: Request, db: Session = Depends(get_db)):
    row = db.query(CampaignSend).filter(CampaignSend.token == token).first()
    if not row:
        raise HTTPException(status_code=404, detail="Token inválido")

    # Marca como aberto
    row.opened = True
    row.opened_at = datetime.utcnow()
    db.commit()

    # Registra evento de clique
    click_event = ClickEvent(
        campaign_send_id=row.id,
        link_url=str(request.url),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", ""),
    )
    db.add(click_event)
    db.commit()

    frontend = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    return RedirectResponse(url=f"{frontend}/training?token={token}")

