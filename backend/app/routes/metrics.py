from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.campaign import Campaign
from app.models.user import User
from app.models.department import Department
from app.models.campaign_send import CampaignSend
from app.models.click_event import ClickEvent
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/metrics", tags=["metrics"])


class DepartmentStat(BaseModel):
    department: str
    sends: int
    clicks: int
    rate: float


class RecentCampaign(BaseModel):
    id: int
    name: str
    status: str
    users: int
    clicks: int
    reports: int
    start_date: Optional[datetime]


class MetricsSummary(BaseModel):
    total_campaigns: int
    active_campaigns: int
    total_users: int
    click_rate: float
    report_rate: float


class DashboardMetrics(BaseModel):
    summary: MetricsSummary
    department_stats: List[DepartmentStat]
    recent_campaigns: List[RecentCampaign]


@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard_metrics(db: Session = Depends(get_db)):
    """Obter métricas do dashboard"""
    
    # Contar campanhas
    total_campaigns = db.query(func.count(Campaign.id)).scalar() or 0
    active_campaigns = db.query(func.count(Campaign.id)).filter(
        Campaign.status == "active"
    ).scalar() or 0
    
    # Contar usuários
    total_users = db.query(func.count(User.id)).scalar() or 0
    
    # Calcular taxa de cliques
    total_sends = db.query(func.count(CampaignSend.id)).scalar() or 0
    total_clicks = db.query(func.count(ClickEvent.id)).scalar() or 0
    click_rate = (total_clicks / total_sends * 100) if total_sends > 0 else 0
    
    # Taxa de reporte (simulado)
    report_rate = 5.0  # Placeholder
    
    # Estatísticas por departamento
    dept_stats_raw = db.query(
        Department.name,
        func.count(CampaignSend.id).label("sends"),
        func.count(ClickEvent.id).label("clicks")
    ).outerjoin(
        User, Department.id == User.department_id
    ).outerjoin(
        CampaignSend, User.email == CampaignSend.recipient_email
    ).outerjoin(
        ClickEvent, CampaignSend.id == ClickEvent.campaign_send_id
    ).group_by(Department.name).all()
    
    department_stats = []
    for dept_name, sends, clicks in dept_stats_raw:
        rate = (clicks / sends * 100) if sends > 0 else 0
        department_stats.append(
            DepartmentStat(
                department=dept_name or "Sem Departamento",
                sends=sends or 0,
                clicks=clicks or 0,
                rate=rate
            )
        )

    # Campanhas recentes (ordenadas por início ou criação)
    recent_campaigns_raw = (
        db.query(
            Campaign.id,
            Campaign.name,
            Campaign.status,
            func.coalesce(Campaign.start_date, Campaign.created_at).label("start_date"),
            func.count(CampaignSend.id).label("users"),
            func.count(ClickEvent.id).label("clicks"),
        )
        .outerjoin(CampaignSend, Campaign.id == CampaignSend.campaign_id)
        .outerjoin(ClickEvent, CampaignSend.id == ClickEvent.campaign_send_id)
        .group_by(Campaign.id)
        .order_by(func.coalesce(Campaign.start_date, Campaign.created_at).desc())
        .limit(5)
        .all()
    )

    recent_campaigns = [
        RecentCampaign(
            id=row.id,
            name=row.name,
            status=row.status or "",
            users=row.users or 0,
            clicks=row.clicks or 0,
            reports=0,  # Placeholder até termos eventos de reporte
            start_date=row.start_date,
        )
        for row in recent_campaigns_raw
    ]
    
    return DashboardMetrics(
        summary=MetricsSummary(
            total_campaigns=total_campaigns,
            active_campaigns=active_campaigns,
            total_users=total_users,
            click_rate=click_rate,
            report_rate=report_rate
        ),
        department_stats=department_stats,
        recent_campaigns=recent_campaigns
    )
