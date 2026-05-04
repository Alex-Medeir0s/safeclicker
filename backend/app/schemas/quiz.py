from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional
from datetime import datetime


XP_FOR_DIFFICULTY = {"Fácil": 10, "Médio": 20, "Difícil": 30}


class QuizQuestionBase(BaseModel):
    text: str
    alternatives: List[str]
    correct_index: int
    difficulty: str = "Fácil"

    @field_validator("alternatives")
    @classmethod
    def must_have_minimum_alternatives(cls, v: List[str]) -> List[str]:
        if len(v) < 3:
            raise ValueError("Cada pergunta precisa ter ao menos 3 alternativas")
        if any(not (a or "").strip() for a in v):
            raise ValueError("Todas as alternativas devem ser preenchidas")
        return v

    @field_validator("correct_index")
    @classmethod
    def correct_index_non_negative(cls, v: int) -> int:
        if v is None:
            raise ValueError("correct_index é obrigatório")
        if v < 0:
            raise ValueError("correct_index deve ser maior ou igual a 0")
        return v

    @model_validator(mode="after")
    def check_correct_index_within_alternatives(self):
        # Validação cross-field: correct_index deve estar dentro do intervalo de alternativas
        if self.correct_index is None:
            raise ValueError("correct_index é obrigatório")
        if not isinstance(self.alternatives, list):
            raise ValueError("alternatives inválidas")
        if self.correct_index < 0 or self.correct_index >= len(self.alternatives):
            raise ValueError("correct_index fora do intervalo das alternativas")
        return self

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
    response_times: Optional[List[int]] = None  # Tempo em segundos por pergunta


class QuizSubmitResponse(BaseModel):
    recorded: bool
    correct_count: int
    total_questions: int
    points_earned: int
    completed_at: datetime
