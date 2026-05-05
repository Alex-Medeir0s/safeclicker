import os
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.access_control import apply_scope, check_resource_access
from app.models.campaign import Campaign
from app.models.campaign_send import CampaignSend
from app.models.click_event import ClickEvent
from app.models.training_completion import TrainingCompletion
from app.models.user import User
from app.models.quiz import Quiz, QuizResponse
from app.schemas.campaign import CampaignCreate, CampaignRead, CampaignUpdate
from app.schemas.quiz import (
    XP_FOR_DIFFICULTY,
    QuizPublic,
    QuizQuestionPublic,
    QuizSubmitRequest,
    QuizSubmitResponse,
)
from app.services.campaign_scheduler import send_campaign_now

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


class CampaignStatusResponse(BaseModel):
    status: str  # "active" ou "disabled"


def annotate_campaigns_has_been_sent(db: Session, campaigns: List[Campaign]) -> None:
    if not campaigns:
        return

    campaign_ids = [campaign.id for campaign in campaigns]
    sent_rows = (
        db.query(CampaignSend.campaign_id)
        .filter(CampaignSend.campaign_id.in_(campaign_ids))
        .distinct()
        .all()
    )
    sent_campaign_ids = {row[0] for row in sent_rows}

    for campaign in campaigns:
        campaign.has_been_sent = campaign.id in sent_campaign_ids


def annotate_campaign_has_been_sent(db: Session, campaign: Campaign) -> None:
    sent_exists = (
        db.query(CampaignSend.id)
        .filter(CampaignSend.campaign_id == campaign.id)
        .first()
    )
    campaign.has_been_sent = sent_exists is not None


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


class CampaignByTokenResponse(BaseModel):
    campaign_id: int
    campaign_name: str
    has_quiz: bool
    quiz_id: Optional[int] = None
    quiz_title: Optional[str] = None
    already_completed: bool = False
    correct_count: Optional[int] = None
    total_questions: Optional[int] = None
    points_earned: Optional[int] = None


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
    annotate_campaigns_has_been_sent(db, campaigns)
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

    annotate_campaign_has_been_sent(db, campaign)
    
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

    if campaign.status in {"active", "sent"}:
        raise HTTPException(
            status_code=400,
            detail="Campanha enviada só pode ser editada após desativar"
        )

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


@router.get("/validate/{token}", response_model=CampaignStatusResponse, include_in_schema=False)
def validate_campaign(token: str, db: Session = Depends(get_db)):
    row = db.query(CampaignSend).filter(CampaignSend.token == token).first()
    if not row:
        raise HTTPException(status_code=404, detail="Token inválido")

    campaign_status = row.campaign.status if row.campaign else "disabled"
    return CampaignStatusResponse(status=campaign_status)
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


@router.get("/by-token/{token}", response_model=CampaignByTokenResponse)
def get_campaign_by_token(token: str, db: Session = Depends(get_db)):
    """Endpoint público — retorna info mínima da campanha pelo token do envio."""
    send_row = db.query(CampaignSend).filter(CampaignSend.token == token).first()
    if not send_row:
        raise HTTPException(status_code=404, detail="Token inválido")

    campaign = send_row.campaign
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    quiz = campaign.quiz
    already_completed = (
        db.query(TrainingCompletion.id)
        .filter(TrainingCompletion.campaign_send_id == send_row.id)
        .first()
        is not None
    )

    latest_response = (
        db.query(QuizResponse)
        .filter(QuizResponse.campaign_send_id == send_row.id)
        .order_by(QuizResponse.submitted_at.desc())
        .first()
    )

    return CampaignByTokenResponse(
        campaign_id=campaign.id,
        campaign_name=campaign.name,
        has_quiz=quiz is not None,
        quiz_id=quiz.id if quiz else None,
        quiz_title=quiz.title if quiz else None,
        already_completed=already_completed,
        correct_count=latest_response.correct_count if latest_response else None,
        total_questions=latest_response.total_questions if latest_response else None,
        points_earned=latest_response.points_earned if latest_response else None,
    )


@router.get("/quiz-by-token/{token}", response_model=QuizPublic)
def get_quiz_by_token(token: str, db: Session = Depends(get_db)):
    """Endpoint público — retorna o quiz da campanha (sem revelar correct_index)."""
    send_row = db.query(CampaignSend).filter(CampaignSend.token == token).first()
    if not send_row:
        raise HTTPException(status_code=404, detail="Token inválido")

    if send_row.campaign and send_row.campaign.status == "disabled":
        raise HTTPException(status_code=400, detail="Campanha desativada")

    quiz = send_row.campaign.quiz if send_row.campaign else None
    if not quiz:
        raise HTTPException(status_code=404, detail="Esta campanha não tem quiz vinculado")

    total_xp = sum(XP_FOR_DIFFICULTY.get(q.difficulty or "Fácil", 0) for q in quiz.questions)
    return QuizPublic(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        category=quiz.category,
        total_xp=total_xp,
        questions=[
            QuizQuestionPublic(
                id=q.id,
                position=q.position,
                text=q.text,
                alternatives=q.alternatives,
                difficulty=q.difficulty,
                xp=q.xp,
            )
            for q in quiz.questions
        ],
    )


def _calculate_points_per_question(
    difficulty: str, 
    response_time_seconds: int, 
    is_correct: bool
) -> int:
    """Calcula pontos de uma pergunta com base em dificuldade e tempo.
    
    Base de pontos por dificuldade:
    - Fácil: 10 pontos
    - Médio: 20 pontos
    - Difícil: 30 pontos
    
    Penalidade: -1 ponto por segundo (mínimo de 5 pontos)
    Só ganha pontos se acertar a pergunta.
    """
    if not is_correct:
        return 0
    
    # Base de pontos por dificuldade
    base_points = {
        "Fácil": 10,
        "Médio": 20,
        "Difícil": 30,
    }.get(difficulty, 10)
    
    # Aplicar penalidade de 1 ponto por segundo (após 2 segundos de graça)
    points = base_points - max(0, response_time_seconds - 2)
    
    # Mínimo de 5 pontos
    return max(points, 5)


@router.post("/quiz/submit", response_model=QuizSubmitResponse)
def submit_quiz(
    payload: QuizSubmitRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Endpoint público — recebe respostas do quiz e marca treinamento como concluído."""
    token = (payload.token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Token é obrigatório")

    send_row = db.query(CampaignSend).filter(CampaignSend.token == token).first()
    print(f"[QUIZ SUBMIT] Token: {token}, send_row: {send_row}")
    if send_row:
        print(f"[QUIZ SUBMIT] send_row.id: {send_row.id}, send_row.user_id: {send_row.user_id}")
    if not send_row:
        raise HTTPException(status_code=404, detail="Token inválido")

    if send_row.campaign and send_row.campaign.status == "disabled":
        raise HTTPException(status_code=400, detail="Campanha desativada")

    quiz = send_row.campaign.quiz if send_row.campaign else None
    if not quiz:
        raise HTTPException(status_code=400, detail="Esta campanha não tem quiz vinculado")

    if len(payload.answers) != len(quiz.questions):
        raise HTTPException(
            status_code=400,
            detail=f"Esperado {len(quiz.questions)} respostas, recebido {len(payload.answers)}",
        )

    correct_count = sum(
        1
        for question, answer in zip(quiz.questions, payload.answers)
        if answer is not None and answer == question.correct_index
    )

    # Calcular pontos ganhos por pergunta
    response_times = payload.response_times or [0] * len(quiz.questions)
    points_earned = sum(
        _calculate_points_per_question(
            quiz.questions[idx].difficulty or "Fácil",
            response_times[idx] if idx < len(response_times) else 0,
            payload.answers[idx] is not None and payload.answers[idx] == quiz.questions[idx].correct_index,
        )
        for idx in range(len(quiz.questions))
    )

    existing_completion = (
        db.query(TrainingCompletion)
        .filter(TrainingCompletion.campaign_send_id == send_row.id)
        .first()
    )

    if existing_completion:
        return QuizSubmitResponse(
            recorded=False,
            correct_count=correct_count,
            total_questions=len(quiz.questions),
            points_earned=points_earned,
            completed_at=existing_completion.completed_at,
        )

    completion = TrainingCompletion(
        campaign_send_id=send_row.id,
        completed_at=datetime.utcnow(),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", ""),
    )
    response_row = QuizResponse(
        campaign_send_id=send_row.id,
        quiz_id=quiz.id,
        answers=payload.answers,
        correct_count=correct_count,
        total_questions=len(quiz.questions),
        response_time_seconds=sum(response_times),
        points_earned=points_earned,
        submitted_at=datetime.utcnow(),
    )

    try:
        db.add(completion)
        db.add(response_row)
        db.commit()
        db.refresh(completion)
        print(f"[QUIZ SUBMIT SUCCESS] campaign_send_id: {send_row.id}, user_id: {send_row.user_id}, quiz_id: {quiz.id}, points: {points_earned}")
    except IntegrityError:
        db.rollback()
        print(f"[QUIZ SUBMIT] IntegrityError - trying to fetch existing completion")
        existing_completion = (
            db.query(TrainingCompletion)
            .filter(TrainingCompletion.campaign_send_id == send_row.id)
            .first()
        )
        if existing_completion:
            return QuizSubmitResponse(
                recorded=False,
                correct_count=correct_count,
                total_questions=len(quiz.questions),
                points_earned=0,
                completed_at=existing_completion.completed_at,
            )
        raise HTTPException(status_code=500, detail="Erro ao registrar conclusão")
    except Exception as e:
        db.rollback()
        print(f"[QUIZ SUBMIT ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao registrar: {str(e)}")

    return QuizSubmitResponse(
        recorded=True,
        correct_count=correct_count,
        total_questions=len(quiz.questions),
        points_earned=points_earned,
        completed_at=completion.completed_at,
    )


@router.get("/quiz/user-responses", response_model=List[dict])
def get_user_quiz_responses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtém o histórico de respostas de quiz do usuário logado."""
    import traceback
    print(f"[USER RESPONSES] Fetching for user_id: {current_user.id}, email: {current_user.email}")
    try:
        quiz_responses = (
            db.query(QuizResponse)
            .join(CampaignSend, QuizResponse.campaign_send_id == CampaignSend.id)
            .join(Quiz, QuizResponse.quiz_id == Quiz.id)
            .filter(CampaignSend.user_id == current_user.id)
            .order_by(QuizResponse.submitted_at.desc())
            .all()
        )

        print(f"[USER RESPONSES] Found {len(quiz_responses)} responses")

        result = []
        for response in quiz_responses:
            try:
                print(f"[USER RESPONSES] Response: quiz_id={response.quiz_id}, points={response.points_earned}, campaign_send_id={response.campaign_send_id}")
                result.append({
                    "quiz_id": response.quiz_id,
                    "quiz_title": response.quiz.title if response.quiz else "Unknown",
                    "quiz_category": response.quiz.category if response.quiz else None,
                    "correct_count": response.correct_count,
                    "total_questions": response.total_questions,
                    "points_earned": response.points_earned,
                    "submitted_at": response.submitted_at.isoformat() if response.submitted_at else None,
                })
            except Exception:
                print("[USER RESPONSES] Error serializing response:")
                traceback.print_exc()
        return result
    except Exception as e:
        print("[USER RESPONSES] Unexpected error:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Erro ao obter respostas do usuário")


@router.get("/quiz/department-ranking", response_model=List[dict])
def get_department_ranking(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtém o ranking de usuários do departamento do gestor com soma de pontos."""
    if not current_user.department_id:
        raise HTTPException(status_code=400, detail="Usuário não tem departamento associado")
    
    try:
        # Query para obter todos os usuários do departamento
        department_users = db.query(User).filter(
            User.department_id == current_user.department_id
        ).all()
        
        result = []
        for user in department_users:
            # Calcular pontos totais para cada usuário
            total_points = (
                db.query(func.coalesce(func.sum(QuizResponse.points_earned), 0))
                .join(CampaignSend, QuizResponse.campaign_send_id == CampaignSend.id)
                .filter(CampaignSend.user_id == user.id)
                .scalar() or 0
            )
            
            result.append({
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "total_points": int(total_points),
            })
        
        # Ordenar por pontos descending
        result.sort(key=lambda x: x["total_points"], reverse=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter ranking: {str(e)}")

