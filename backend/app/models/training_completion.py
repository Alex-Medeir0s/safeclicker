from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class TrainingCompletion(Base):
    __tablename__ = "training_completions"

    id = Column(Integer, primary_key=True, index=True)
    campaign_send_id = Column(
        Integer,
        ForeignKey("campaign_sends.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    completed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign_send = relationship("CampaignSend", back_populates="training_completion")
