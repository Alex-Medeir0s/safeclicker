from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    template_id = Column(Integer, ForeignKey("templates.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="draft")  # draft, active, paused, completed
    target_audience = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    template = relationship("Template", back_populates="campaigns")
    created_by_user = relationship("User", back_populates="campaigns")
    campaign_sends = relationship("CampaignSend", back_populates="campaign")

