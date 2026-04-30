from datetime import datetime
from typing import List

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
)


router = APIRouter(prefix="/quizzes", tags=["quizzes"])


REQUIRED_QUESTIONS = {"Fácil": 15, "Médio": 10, "Difícil": 5}


def _validate_question_count(difficulty: str, question_count: int) -> None:
    expected = REQUIRED_QUESTIONS.get(difficulty)
    if expected is None:
        raise HTTPException(
            status_code=400,
            detail=f"Dificuldade inválida: {difficulty}",
        )
    if question_count != expected:
        raise HTTPException(
            status_code=400,
            detail=f"Dificuldade {difficulty} exige exatamente {expected} perguntas",
        )


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
        summaries.append(
            QuizSummary(
                id=quiz.id,
                title=quiz.title,
                category=quiz.category,
                difficulty=quiz.difficulty,
                xp=quiz.xp,
                question_count=len(quiz.questions),
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
    _validate_question_count(payload.difficulty, len(payload.questions))

    quiz = Quiz(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        difficulty=payload.difficulty,
        xp=payload.xp,
        created_by=current_user.id,
    )
    for idx, question in enumerate(payload.questions):
        quiz.questions.append(
            QuizQuestion(
                position=idx,
                text=question.text,
                alternatives=question.alternatives,
                correct_index=question.correct_index,
            )
        )

    try:
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao criar quiz")
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
    new_difficulty = data.get("difficulty", quiz.difficulty)

    if new_questions is not None:
        _validate_question_count(new_difficulty, len(new_questions))

    for key, value in data.items():
        setattr(quiz, key, value)

    if new_questions is not None:
        quiz.questions.clear()
        db.flush()
        for idx, question in enumerate(new_questions):
            quiz.questions.append(
                QuizQuestion(
                    position=idx,
                    text=question["text"],
                    alternatives=question["alternatives"],
                    correct_index=question["correct_index"],
                )
            )

    try:
        db.commit()
        db.refresh(quiz)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao atualizar quiz")
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
