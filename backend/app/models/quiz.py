from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    difficulty = Column(String, nullable=True)
    xp = Column(Integer, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    questions = relationship(
        "QuizQuestion",
        back_populates="quiz",
        cascade="all, delete-orphan",
        order_by="QuizQuestion.position",
        passive_deletes=True,
    )
    campaigns = relationship("Campaign", back_populates="quiz")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False, default=0)
    text = Column(Text, nullable=False)
    alternatives = Column(JSON, nullable=False)
    correct_index = Column(Integer, nullable=False)
    difficulty = Column(String, nullable=True)
    xp = Column(Integer, nullable=True)

    quiz = relationship("Quiz", back_populates="questions")


class QuizResponse(Base):
    __tablename__ = "quiz_responses"

    id = Column(Integer, primary_key=True, index=True)
    campaign_send_id = Column(
        Integer,
        ForeignKey("campaign_sends.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False, index=True)
    answers = Column(JSON, nullable=False)
    correct_count = Column(Integer, nullable=False, default=0)
    total_questions = Column(Integer, nullable=False, default=0)
    response_time_seconds = Column(Integer, nullable=True, default=0)
    points_earned = Column(Integer, nullable=True, default=0)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    quiz = relationship("Quiz")
