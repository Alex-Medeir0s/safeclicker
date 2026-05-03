from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime


XP_FOR_DIFFICULTY = {"Fácil": 100, "Médio": 180, "Difícil": 260}


class QuizQuestionBase(BaseModel):
    text: str
    alternatives: List[str]
    correct_index: int
    difficulty: str = "Fácil"

    @field_validator("alternatives")
    @classmethod
    def must_have_five_alternatives(cls, v: List[str]) -> List[str]:
        if len(v) != 5:
            raise ValueError("Cada pergunta precisa ter exatamente 5 alternativas")
        if any(not (a or "").strip() for a in v):
            raise ValueError("Todas as alternativas devem ser preenchidas")
        return v

    @field_validator("correct_index")
    @classmethod
    def correct_index_in_range(cls, v: int) -> int:
        if v < 0 or v > 4:
            raise ValueError("correct_index deve estar entre 0 e 4")
        return v

    @field_validator("difficulty")
    @classmethod
    def difficulty_valid(cls, v: str) -> str:
        if v not in XP_FOR_DIFFICULTY:
            raise ValueError("Dificuldade inválida; use Fácil, Médio ou Difícil")
        return v


class QuizQuestionCreate(QuizQuestionBase):
    pass


class QuizQuestionRead(QuizQuestionBase):
    id: int
    position: int
    xp: Optional[int] = None

    class Config:
        from_attributes = True


class QuizQuestionPublic(BaseModel):
    """Versão da pergunta para o colaborador — sem revelar correct_index."""
    id: int
    position: int
    text: str
    alternatives: List[str]
    difficulty: Optional[str] = None
    xp: Optional[int] = None

    class Config:
        from_attributes = True


class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None


class QuizCreate(QuizBase):
    questions: List[QuizQuestionCreate] = Field(default_factory=list)


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    questions: Optional[List[QuizQuestionCreate]] = None


class QuizRead(QuizBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    questions: List[QuizQuestionRead] = Field(default_factory=list)

    class Config:
        from_attributes = True


class QuizSummary(BaseModel):
    id: int
    title: str
    category: Optional[str] = None
    question_count: int
    total_xp: int

    class Config:
        from_attributes = True


class QuizPublic(BaseModel):
    """Versão pública usada pelo colaborador via token (sem correct_index)."""
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    total_xp: int
    questions: List[QuizQuestionPublic]

    class Config:
        from_attributes = True


class QuizSubmitRequest(BaseModel):
    token: str
    answers: List[Optional[int]]


class QuizSubmitResponse(BaseModel):
    recorded: bool
    correct_count: int
    total_questions: int
    completed_at: datetime
