from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    subject = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    html_template = Column(Text, nullable=True)
    template_id = Column(Integer, ForeignKey("templates.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    status = Column(String, default="draft")  # draft, active, paused, completed
    complexity = Column(String, default="basico")  # basico, intermediario, avancado
    trigger = Column(String, nullable=True)  # urgencia, autoridade, medo, recompensa
    target_audience = Column(String, nullable=True)
    target_department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    template = relationship("Template", back_populates="campaigns")
    created_by_user = relationship("User", back_populates="campaigns")
    campaign_sends = relationship("CampaignSend", back_populates="campaign")
    department = relationship("Department", foreign_keys=[department_id])
    target_department = relationship("Department", foreign_keys=[target_department_id])

