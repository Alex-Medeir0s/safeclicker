import asyncio
import logging
import os
import secrets
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.campaign import Campaign
from app.models.campaign_send import CampaignSend
from app.models.click_event import ClickEvent
from app.models.training_completion import TrainingCompletion
from app.models.user import User
from app.services.email_service import email_service

logger = logging.getLogger(__name__)


def _get_department_ids(campaign: Campaign) -> list[int]:
    department_ids: list[int] = []

    if campaign.target_audience:
        try:
            department_ids = [int(dept.strip()) for dept in campaign.target_audience.split(",") if dept.strip()]
        except ValueError:
            department_ids = []

    if not department_ids and campaign.target_department_id:
        department_ids = [campaign.target_department_id]

    return department_ids


async def send_campaign_now(db: Session, campaign: Campaign) -> dict:
    if campaign.status == "disabled":
        raise HTTPException(status_code=400, detail="Campanha desativada não pode ser enviada")

    if not campaign.target_department_id:
        raise HTTPException(status_code=400, detail="Campanha sem departamento alvo definido")

    if not campaign.html_template:
        raise HTTPException(status_code=400, detail="Campanha sem template HTML configurado")

    department_ids = _get_department_ids(campaign)
    if not department_ids:
        raise HTTPException(status_code=400, detail="Nenhum departamento alvo definido")

    users = (
        db.query(User)
        .filter(User.department_id.in_(department_ids), User.is_active == True)
        .all()
    )

    if not users:
        dept_names = ", ".join(str(d) for d in department_ids)
        raise HTTPException(status_code=400, detail=f"Nenhum usuário ativo nos departamentos {dept_names}")

    base_url = os.getenv("APP_BASE_URL", "http://localhost:8000").rstrip("/")
    sent = 0
    errors = []

    campaign.status = "active"
    db.commit()
    db.refresh(campaign)

    for user in users:
        token = secrets.token_urlsafe(24)

        send_row = CampaignSend(
            campaign_id=campaign.id,
            user_id=user.id,
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
        "departments": department_ids,
        "sent": sent,
        "errors": errors,
        "status": campaign.status,
    }


async def process_due_campaigns() -> None:
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        due_campaigns = (
            db.query(Campaign)
            .filter(
                Campaign.status == "scheduled",
                Campaign.start_date.isnot(None),
                Campaign.start_date <= now,
            )
            .order_by(Campaign.start_date.asc())
            .all()
        )

        for campaign in due_campaigns:
            try:
                await send_campaign_now(db, campaign)
                logger.info("Campanha agendada enviada com sucesso: %s", campaign.id)
            except HTTPException as exc:
                logger.warning("Campanha %s não enviada automaticamente: %s", campaign.id, exc.detail)
            except Exception:
                logger.exception("Erro ao enviar campanha agendada %s", campaign.id)
    finally:
        db.close()


async def campaign_scheduler_loop(interval_seconds: int = 60) -> None:
    while True:
        try:
            await process_due_campaigns()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Erro no loop de campanhas agendadas")

        await asyncio.sleep(interval_seconds)