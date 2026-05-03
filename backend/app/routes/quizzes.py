from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.quiz import Quiz, QuizQuestion
from app.schemas.quiz import (
    QuizCreate,
    QuizRead,
    QuizSummary,
    QuizUpdate,
    XP_FOR_DIFFICULTY,
)


router = APIRouter(prefix="/quizzes", tags=["quizzes"])


def _xp_for(difficulty: Optional[str]) -> int:
    if not difficulty:
        return 0
    return XP_FOR_DIFFICULTY.get(difficulty, 0)


@router.get("", response_model=List[QuizSummary])
def list_quizzes(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quizzes = db.query(Quiz).order_by(Quiz.created_at.desc()).offset(skip).limit(limit).all()
    summaries = []
    for quiz in quizzes:
        total_xp = sum(_xp_for(q.difficulty) for q in quiz.questions)
        summaries.append(
            QuizSummary(
                id=quiz.id,
                title=quiz.title,
                category=quiz.category,
                question_count=len(quiz.questions),
                total_xp=total_xp,
            )
        )
    return summaries


@router.get("/{quiz_id}", response_model=QuizRead)
def get_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz não encontrado")
    return quiz


@router.post("", response_model=QuizRead)
def create_quiz(
    payload: QuizCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.questions:
        raise HTTPException(status_code=400, detail="Adicione ao menos uma pergunta")

    quiz = Quiz(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        created_by=current_user.id,
    )
    for idx, question in enumerate(payload.questions):
        quiz.questions.append(
            QuizQuestion(
                position=idx,
                text=question.text,
                alternatives=question.alternatives,
                correct_index=question.correct_index,
                difficulty=question.difficulty,
                xp=_xp_for(question.difficulty),
            )
        )

    try:
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
    except SQLAlchemyError as exc:
        db.rollback()
        print(f"[create_quiz] erro SQL: {exc}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar quiz: {exc}")
    return quiz


@router.put("/{quiz_id}", response_model=QuizRead)
def update_quiz(
    quiz_id: int,
    payload: QuizUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz não encontrado")

    data = payload.dict(exclude_unset=True)
    new_questions = data.pop("questions", None)

    for key, value in data.items():
        setattr(quiz, key, value)

    if new_questions is not None:
        if not new_questions:
            raise HTTPException(status_code=400, detail="Adicione ao menos uma pergunta")
        quiz.questions.clear()
        db.flush()
        for idx, question in enumerate(new_questions):
            difficulty = question.get("difficulty") or "Fácil"
            quiz.questions.append(
                QuizQuestion(
                    position=idx,
                    text=question["text"],
                    alternatives=question["alternatives"],
                    correct_index=question["correct_index"],
                    difficulty=difficulty,
                    xp=_xp_for(difficulty),
                )
            )

    try:
        db.commit()
        db.refresh(quiz)
    except SQLAlchemyError as exc:
        db.rollback()
        print(f"[update_quiz] erro SQL: {exc}")
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar quiz: {exc}")
    return quiz


@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz não encontrado")

    try:
        db.delete(quiz)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir: quiz vinculado a campanhas",
        )
    return {"message": "Quiz excluído"}
