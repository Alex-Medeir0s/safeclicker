from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.access_control import apply_scope
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


class ClickDetail(BaseModel):
    full_name: str
    email: str
    clicked_at: Optional[datetime]
    ip_address: Optional[str]


class CampaignClickDetails(BaseModel):
    campaign_id: int
    campaign_name: str
    total_sends: int
    total_clicks: int
    clicks: List[ClickDetail]


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
    emails_received: int
    emails_clicked: int
    click_rate: float
    report_rate: float


class DashboardMetrics(BaseModel):
    summary: MetricsSummary
    department_stats: List[DepartmentStat]
    recent_campaigns: List[RecentCampaign]


@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter métricas do dashboard com filtro por role e departamento"""
    
    # Aplicar scope nas queries
    campaigns_query = apply_scope(db.query(Campaign), Campaign, current_user)
    users_query = apply_scope(db.query(User), User, current_user)
    sends_query = apply_scope(db.query(CampaignSend), CampaignSend, current_user)
    
    # Contar campanhas
    total_campaigns = campaigns_query.count()
    active_campaigns = campaigns_query.filter(Campaign.status == "active").count()
    
    # Contar usuários
    total_users = users_query.count()
    
    # Calcular taxa de cliques e contagem individual de envios/cliques
    total_sends = sends_query.count()
    
    # Clicks com escopo
    total_clicks = (
        db.query(func.count(ClickEvent.id))
        .join(CampaignSend, ClickEvent.campaign_send_id == CampaignSend.id)
        .join(User, CampaignSend.user_id == User.id)
    )
    
    # Aplicar filtro de departamento para clicks
    from app.models.user import UserRole
    if current_user.role == UserRole.GESTOR:
        total_clicks = total_clicks.filter(User.department_id == current_user.department_id)
    elif current_user.role == UserRole.COLABORADOR:
        total_clicks = total_clicks.filter(CampaignSend.user_id == current_user.id)
    
    total_clicks = total_clicks.scalar() or 0
    click_rate = (total_clicks / total_sends * 100) if total_sends > 0 else 0
    
    # Taxa de reporte (simulado)
    report_rate = 5.0  # Placeholder
    
    # Estatísticas por departamento (apenas para TI e Gestor do próprio dept)
    if current_user.role == UserRole.TI:
        dept_stats_raw = db.query(
            Department.name,
            func.count(CampaignSend.id).label("sends"),
            func.count(ClickEvent.id).label("clicks")
        ).outerjoin(
            User, Department.id == User.department_id
        ).outerjoin(
            CampaignSend, User.id == CampaignSend.user_id
        ).outerjoin(
            ClickEvent, CampaignSend.id == ClickEvent.campaign_send_id
        ).group_by(Department.name).all()
    elif current_user.role == UserRole.GESTOR and current_user.department_id:
        dept_stats_raw = db.query(
            Department.name,
            func.count(CampaignSend.id).label("sends"),
            func.count(ClickEvent.id).label("clicks")
        ).filter(
            Department.id == current_user.department_id
        ).outerjoin(
            User, Department.id == User.department_id
        ).outerjoin(
            CampaignSend, User.id == CampaignSend.user_id
        ).outerjoin(
            ClickEvent, CampaignSend.id == ClickEvent.campaign_send_id
        ).group_by(Department.name).all()
    else:
        dept_stats_raw = []
    
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

    # Campanhas recentes (ordenadas por início ou criação) com scope
    recent_campaigns_query = apply_scope(db.query(Campaign), Campaign, current_user)
    recent_campaigns_raw = (
        recent_campaigns_query
        .add_columns(
            Campaign.id,
            Campaign.name,
            Campaign.status,
            func.coalesce(Campaign.start_date, Campaign.created_at).label("start_date"),
        )
        .outerjoin(CampaignSend, Campaign.id == CampaignSend.campaign_id)
        .outerjoin(ClickEvent, CampaignSend.id == ClickEvent.campaign_send_id)
        .group_by(Campaign.id)
        .order_by(func.coalesce(Campaign.start_date, Campaign.created_at).desc())
        .limit(5)
        .all()
    )

    recent_campaigns = []
    for row in recent_campaigns_raw:
        # Contar sends e clicks para esta campanha com scope
        campaign_id = row.id if hasattr(row, 'id') else row[1]
        campaign_name = row.name if hasattr(row, 'name') else row[2]
        campaign_status = row.status if hasattr(row, 'status') else row[3]
        start_date = row.start_date if hasattr(row, 'start_date') else row[4]
        
        users_count = (
            apply_scope(db.query(CampaignSend), CampaignSend, current_user)
            .filter(CampaignSend.campaign_id == campaign_id)
            .count()
        )
        
        clicks_count = (
            db.query(ClickEvent)
            .join(CampaignSend, ClickEvent.campaign_send_id == CampaignSend.id)
            .filter(CampaignSend.campaign_id == campaign_id)
        )
        
        from app.models.user import UserRole
        if current_user.role == UserRole.GESTOR:
            clicks_count = clicks_count.join(User, CampaignSend.user_id == User.id).filter(
                User.department_id == current_user.department_id
            )
        elif current_user.role == UserRole.COLABORADOR:
            clicks_count = clicks_count.filter(CampaignSend.user_id == current_user.id)
        
        clicks_count = clicks_count.count()
        
        recent_campaigns.append(
            RecentCampaign(
                id=campaign_id,
                name=campaign_name,
                status=campaign_status or "",
                users=users_count,
                clicks=clicks_count,
                reports=0,
                start_date=start_date,
            )
        )
    
    return DashboardMetrics(
        summary=MetricsSummary(
            total_campaigns=total_campaigns,
            active_campaigns=active_campaigns,
            total_users=total_users,
            emails_received=total_sends,
            emails_clicked=total_clicks,
            click_rate=click_rate,
            report_rate=report_rate
        ),
        department_stats=department_stats,
        recent_campaigns=recent_campaigns
    )


@router.get("/campaigns/{campaign_id}/clicks", response_model=CampaignClickDetails)
async def get_campaign_clicks(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter detalhes dos cliques de uma campanha (usuários que clicaram)"""
    from app.core.access_control import check_resource_access
    
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    
    # Verificar acesso
    if not check_resource_access(campaign, current_user):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Query para obter usuários que clicaram com scope
    clicks_query = db.query(
        User.full_name,
        User.email,
        ClickEvent.created_at,
        ClickEvent.ip_address
    ).join(
        CampaignSend, User.id == CampaignSend.user_id
    ).join(
        ClickEvent, CampaignSend.id == ClickEvent.campaign_send_id
    ).filter(
        CampaignSend.campaign_id == campaign_id
    )
    
    # Aplicar filtro de acesso
    from app.models.user import UserRole
    if current_user.role == UserRole.GESTOR:
        clicks_query = clicks_query.filter(User.department_id == current_user.department_id)
    elif current_user.role == UserRole.COLABORADOR:
        clicks_query = clicks_query.filter(User.id == current_user.id)
    
    clicks_raw = clicks_query.order_by(ClickEvent.created_at.desc()).all()
    
    # Total de envios com scope
    sends_query = apply_scope(db.query(CampaignSend), CampaignSend, current_user)
    total_sends = sends_query.filter(CampaignSend.campaign_id == campaign_id).count()
    
    clicks = [
        ClickDetail(
            full_name=row.full_name or "Desconhecido",
            email=row.email,
            clicked_at=row.created_at,
            ip_address=row.ip_address
        )
        for row in clicks_raw
    ]
    
    return CampaignClickDetails(
        campaign_id=campaign_id,
        campaign_name=campaign.name,
        total_sends=total_sends,
        total_clicks=len(clicks),
        clicks=clicks
    )
