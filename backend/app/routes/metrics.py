from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.access_control import apply_scope
from app.models.campaign import Campaign
from app.models.user import User
from app.models.department import Department
from app.models.campaign_send import CampaignSend
from app.models.click_event import ClickEvent
from app.models.training_completion import TrainingCompletion
from pydantic import BaseModel
from typing import List, Optional, Dict, Set
from datetime import datetime

router = APIRouter(prefix="/metrics", tags=["metrics"])


class DepartmentStat(BaseModel):
    department: str
    sends: int
    clicks: int
    rate: float


class CollaboratorStat(BaseModel):
    full_name: str
    email: str
    sends: int
    clicks: int
    campaigns: List[str]


class ClickDetail(BaseModel):
    full_name: str
    email: str
    clicked_at: Optional[datetime]
    ip_address: Optional[str]
    training_completed: bool = False
    training_completed_at: Optional[datetime] = None


class CampaignClickDetails(BaseModel):
    campaign_id: int
    campaign_name: str
    total_sends: int
    total_clicks: int
    total_trainings: int = 0
    clicks: List[ClickDetail]


class RecentCampaign(BaseModel):
    id: int
    name: str
    status: str
    users: int
    clicks: int
    trainings_completed: int = 0
    reports: int
    start_date: Optional[datetime]


class SentCampaign(BaseModel):
    campaign_id: int
    campaign_name: str
    sends: int
    clicks: int
    click_rate: float
    last_sent_at: Optional[datetime]


class CollaboratorPhishingSend(BaseModel):
    send_id: int
    campaign_id: int
    campaign_name: str
    sent_at: Optional[datetime]
    clicked: bool = False
    clicked_at: Optional[datetime] = None
    training_completed: bool = False
    training_completed_at: Optional[datetime] = None


class MetricsSummary(BaseModel):
    total_campaigns: int
    active_campaigns: int
    total_users: int
    emails_received: int
    emails_clicked: int
    trainings_completed: int = 0
    click_rate: float
    report_rate: float
    department_campaigns: Optional[int] = None


class DashboardMetrics(BaseModel):
    summary: MetricsSummary
    department_stats: List[DepartmentStat]
    recent_campaigns: List[RecentCampaign]
    sent_campaigns: List[SentCampaign] = []
    collaborator_phishing_sends: List[CollaboratorPhishingSend] = []
    collaborators: List[CollaboratorStat] = []


@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter métricas do dashboard com filtro por role e departamento"""
    
    # Aplicar scope nas queries
    campaigns_query = apply_scope(db.query(Campaign), Campaign, current_user)
    users_query = apply_scope(db.query(User), User, current_user)
    sends_query = apply_scope(db.query(CampaignSend), CampaignSend, current_user).join(
        Campaign, CampaignSend.campaign_id == Campaign.id
    )
    
    # Contar campanhas
    total_campaigns = campaigns_query.count()
    active_campaigns = campaigns_query.filter(Campaign.status == "active").count()
    
    # Contar usuários
    total_users = users_query.count()
    
    # Calcular taxa de cliques e contagem individual de envios/cliques
    total_sends = sends_query.count()
    
    # Clicks com escopo (contagem por envio que recebeu ao menos um clique)
    total_clicks = (
        db.query(func.count(func.distinct(CampaignSend.id)))
        .join(Campaign, CampaignSend.campaign_id == Campaign.id)
        .join(ClickEvent, ClickEvent.campaign_send_id == CampaignSend.id)
        .join(User, CampaignSend.user_id == User.id)
    )
    
    # Aplicar filtro de departamento para clicks
    from app.models.user import UserRole
    if current_user.role == UserRole.GESTOR:
        total_clicks = total_clicks.filter(User.department_id == current_user.department_id)
    elif current_user.role == UserRole.COLABORADOR:
        total_clicks = total_clicks.filter(CampaignSend.user_id == current_user.id)
    
    total_clicks = total_clicks.scalar() or 0
    trainings_completed_query = (
        db.query(func.count(func.distinct(TrainingCompletion.campaign_send_id)))
        .join(CampaignSend, TrainingCompletion.campaign_send_id == CampaignSend.id)
    )

    if current_user.role == UserRole.GESTOR:
        trainings_completed_query = trainings_completed_query.join(
            User, CampaignSend.user_id == User.id
        ).filter(User.department_id == current_user.department_id)
    elif current_user.role == UserRole.COLABORADOR:
        trainings_completed_query = trainings_completed_query.filter(
            CampaignSend.user_id == current_user.id
        )

    trainings_completed = trainings_completed_query.scalar() or 0
    click_rate = (total_clicks / total_sends * 100) if total_sends > 0 else 0
    
    # Taxa de reporte (simulado)
    report_rate = 5.0  # Placeholder
    
    # Contar campanhas do departamento (para Gestor)
    department_campaigns = None
    if current_user.role == UserRole.GESTOR and current_user.department_id:
        # Contar campanhas que têm usuários do departamento do gestor
        department_campaigns = (
            db.query(func.count(func.distinct(CampaignSend.campaign_id)))
            .join(Campaign, CampaignSend.campaign_id == Campaign.id)
            .join(User, CampaignSend.user_id == User.id)
            .filter(User.department_id == current_user.department_id)
            .scalar() or 0
        )
    
    # Estatísticas por departamento (apenas para TI e Gestor do próprio dept)
    if current_user.role == UserRole.TI:
        dept_stats_raw = db.query(
            Department.name,
            func.count(
                func.distinct(
                    case((Campaign.id.isnot(None), CampaignSend.id), else_=None)
                )
            ).label("sends"),
            func.count(
                func.distinct(
                    case(
                        ((Campaign.id.isnot(None)) & (ClickEvent.id.isnot(None)), CampaignSend.id),
                        else_=None,
                    )
                )
            ).label("clicks")
        ).outerjoin(
            User, Department.id == User.department_id
        ).outerjoin(
            CampaignSend, User.id == CampaignSend.user_id
        ).outerjoin(
            Campaign, CampaignSend.campaign_id == Campaign.id
        ).outerjoin(
            ClickEvent, CampaignSend.id == ClickEvent.campaign_send_id
        ).group_by(Department.name).all()
    elif current_user.role == UserRole.GESTOR and current_user.department_id:
        dept_stats_raw = db.query(
            Department.name,
            func.count(
                func.distinct(
                    case((Campaign.id.isnot(None), CampaignSend.id), else_=None)
                )
            ).label("sends"),
            func.count(
                func.distinct(
                    case(
                        ((Campaign.id.isnot(None)) & (ClickEvent.id.isnot(None)), CampaignSend.id),
                        else_=None,
                    )
                )
            ).label("clicks")
        ).filter(
            Department.id == current_user.department_id
        ).outerjoin(
            User, Department.id == User.department_id
        ).outerjoin(
            CampaignSend, User.id == CampaignSend.user_id
        ).outerjoin(
            Campaign, CampaignSend.campaign_id == Campaign.id
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

    # Colaboradores do departamento (apenas Gestor)
    collaborator_stats: List[CollaboratorStat] = []
    if current_user.role == UserRole.GESTOR and current_user.department_id:
        dept_users = apply_scope(db.query(User), User, current_user).all()

        sends_by_user = (
            apply_scope(
                db.query(CampaignSend.user_id, func.count(CampaignSend.id).label("sends")),
                CampaignSend,
                current_user,
            )
            .join(Campaign, CampaignSend.campaign_id == Campaign.id)
            .group_by(CampaignSend.user_id)
            .all()
        )

        clicks_by_user = (
            apply_scope(
                db.query(
                    CampaignSend.user_id,
                    func.count(func.distinct(CampaignSend.id)).label("clicks"),
                )
                .join(ClickEvent, CampaignSend.id == ClickEvent.campaign_send_id)
                .join(Campaign, CampaignSend.campaign_id == Campaign.id),
                CampaignSend,
                current_user,
            )
            .group_by(CampaignSend.user_id)
            .all()
        )

        campaigns_by_user = (
            apply_scope(
                db.query(CampaignSend.user_id, Campaign.name)
                .join(Campaign, CampaignSend.campaign_id == Campaign.id),
                CampaignSend,
                current_user,
            )
            .group_by(CampaignSend.user_id, Campaign.name)
            .all()
        )

        sends_map: Dict[int, int] = {row[0]: row[1] or 0 for row in sends_by_user}
        clicks_map: Dict[int, int] = {row[0]: row[1] or 0 for row in clicks_by_user}
        campaigns_map: Dict[int, Set[str]] = {}
        for user_id, campaign_name in campaigns_by_user:
            if user_id not in campaigns_map:
                campaigns_map[user_id] = set()
            campaigns_map[user_id].add(campaign_name)

        for u in dept_users:
            collaborator_stats.append(
                CollaboratorStat(
                    full_name=u.full_name or u.email or "Usuário",
                    email=u.email or "",
                    sends=sends_map.get(u.id, 0),
                    clicks=clicks_map.get(u.id, 0),
                    campaigns=sorted(list(campaigns_map.get(u.id, set())))
                )
            )

    sent_campaigns: List[SentCampaign] = []
    collaborator_phishing_sends: List[CollaboratorPhishingSend] = []
    if current_user.role == UserRole.GESTOR and current_user.department_id:
        sent_campaigns_raw = (
            db.query(
                Campaign.id.label("campaign_id"),
                Campaign.name.label("campaign_name"),
                func.count(func.distinct(CampaignSend.id)).label("sends"),
                func.count(
                    func.distinct(
                        case((ClickEvent.id.isnot(None), CampaignSend.id), else_=None)
                    )
                ).label("clicks"),
                func.max(CampaignSend.sent_at).label("last_sent_at"),
            )
            .join(CampaignSend, Campaign.id == CampaignSend.campaign_id)
            .join(User, CampaignSend.user_id == User.id)
            .outerjoin(ClickEvent, CampaignSend.id == ClickEvent.campaign_send_id)
            .filter(User.department_id == current_user.department_id)
            .group_by(Campaign.id, Campaign.name)
            .order_by(func.max(CampaignSend.sent_at).desc())
            .all()
        )

        for row in sent_campaigns_raw:
            sends = row.sends or 0
            clicks = row.clicks or 0
            sent_campaigns.append(
                SentCampaign(
                    campaign_id=row.campaign_id,
                    campaign_name=row.campaign_name,
                    sends=sends,
                    clicks=clicks,
                    click_rate=(clicks / sends * 100) if sends > 0 else 0,
                    last_sent_at=row.last_sent_at,
                )
            )

    if current_user.role == UserRole.COLABORADOR:
        collaborator_sends_raw = (
            db.query(
                CampaignSend.id.label("send_id"),
                Campaign.id.label("campaign_id"),
                Campaign.name.label("campaign_name"),
                CampaignSend.sent_at.label("sent_at"),
                func.max(ClickEvent.created_at).label("clicked_at"),
                func.max(TrainingCompletion.completed_at).label("training_completed_at"),
            )
            .join(Campaign, CampaignSend.campaign_id == Campaign.id)
            .outerjoin(ClickEvent, CampaignSend.id == ClickEvent.campaign_send_id)
            .outerjoin(TrainingCompletion, CampaignSend.id == TrainingCompletion.campaign_send_id)
            .filter(CampaignSend.user_id == current_user.id)
            .group_by(CampaignSend.id, Campaign.id, Campaign.name, CampaignSend.sent_at)
            .order_by(CampaignSend.sent_at.desc())
            .all()
        )

        for row in collaborator_sends_raw:
            collaborator_phishing_sends.append(
                CollaboratorPhishingSend(
                    send_id=row.send_id,
                    campaign_id=row.campaign_id,
                    campaign_name=row.campaign_name,
                    sent_at=row.sent_at,
                    clicked=row.clicked_at is not None,
                    clicked_at=row.clicked_at,
                    training_completed=row.training_completed_at is not None,
                    training_completed_at=row.training_completed_at,
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
            Campaign.updated_at.label("updated_at"),
        )
        .outerjoin(CampaignSend, Campaign.id == CampaignSend.campaign_id)
        .outerjoin(ClickEvent, CampaignSend.id == ClickEvent.campaign_send_id)
        .group_by(Campaign.id)
        .order_by(Campaign.updated_at.desc(), func.coalesce(Campaign.start_date, Campaign.created_at).desc())
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
            db.query(func.count(func.distinct(CampaignSend.id)))
            .join(ClickEvent, ClickEvent.campaign_send_id == CampaignSend.id)
            .filter(CampaignSend.campaign_id == campaign_id)
        )

        trainings_count = (
            db.query(func.count(func.distinct(CampaignSend.id)))
            .join(TrainingCompletion, TrainingCompletion.campaign_send_id == CampaignSend.id)
            .filter(CampaignSend.campaign_id == campaign_id)
        )
        
        from app.models.user import UserRole
        if current_user.role == UserRole.GESTOR:
            clicks_count = clicks_count.join(User, CampaignSend.user_id == User.id).filter(
                User.department_id == current_user.department_id
            )
            trainings_count = trainings_count.join(User, CampaignSend.user_id == User.id).filter(
                User.department_id == current_user.department_id
            )
        elif current_user.role == UserRole.COLABORADOR:
            clicks_count = clicks_count.filter(CampaignSend.user_id == current_user.id)
            trainings_count = trainings_count.filter(CampaignSend.user_id == current_user.id)
        
        # Para colaborador, só exibir campanhas que ele realmente recebeu.
        if current_user.role == UserRole.COLABORADOR and users_count == 0:
            continue

        clicks_count = clicks_count.scalar() or 0
        trainings_count = trainings_count.scalar() or 0
        
        recent_campaigns.append(
            RecentCampaign(
                id=campaign_id,
                name=campaign_name,
                status=campaign_status or "",
                users=users_count,
                clicks=clicks_count,
                trainings_completed=trainings_count,
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
            trainings_completed=trainings_completed,
            click_rate=click_rate,
            report_rate=report_rate,
            department_campaigns=department_campaigns
        ),
        department_stats=department_stats,
        recent_campaigns=recent_campaigns,
        sent_campaigns=sent_campaigns,
        collaborator_phishing_sends=collaborator_phishing_sends,
        collaborators=collaborator_stats
    )


@router.get("/campaigns/{campaign_id}/clicks", response_model=CampaignClickDetails)
async def get_campaign_clicks(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obter detalhes de interação de uma campanha (somente quem clicou, com status de treinamento)"""
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
        func.max(ClickEvent.created_at).label("clicked_at"),
        func.max(ClickEvent.ip_address).label("ip_address"),
        func.max(TrainingCompletion.completed_at).label("training_completed_at"),
    ).join(
        CampaignSend, User.id == CampaignSend.user_id
    ).join(
        ClickEvent, CampaignSend.id == ClickEvent.campaign_send_id
    ).outerjoin(
        TrainingCompletion, CampaignSend.id == TrainingCompletion.campaign_send_id
    ).filter(
        CampaignSend.campaign_id == campaign_id
    )
    
    # Aplicar filtro de acesso
    from app.models.user import UserRole
    if current_user.role == UserRole.GESTOR:
        clicks_query = clicks_query.filter(User.department_id == current_user.department_id)
    elif current_user.role == UserRole.COLABORADOR:
        clicks_query = clicks_query.filter(User.id == current_user.id)

    clicks_query = clicks_query.group_by(CampaignSend.id, User.full_name, User.email)
    
    clicks_raw = clicks_query.order_by(func.max(ClickEvent.created_at).desc()).all()
    
    # Total de envios com scope
    sends_query = apply_scope(db.query(CampaignSend), CampaignSend, current_user)
    total_sends = sends_query.filter(CampaignSend.campaign_id == campaign_id).count()
    
    clicks = [
        ClickDetail(
            full_name=row.full_name or "Desconhecido",
            email=row.email,
            clicked_at=row.clicked_at,
            ip_address=row.ip_address,
            training_completed=row.training_completed_at is not None,
            training_completed_at=row.training_completed_at,
        )
        for row in clicks_raw
    ]

    total_trainings = sum(1 for click in clicks if click.training_completed)
    
    return CampaignClickDetails(
        campaign_id=campaign_id,
        campaign_name=campaign.name,
        total_sends=total_sends,
        total_clicks=len(clicks),
        total_trainings=total_trainings,
        clicks=clicks,
    )
