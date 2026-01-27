from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean, String
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class CampaignSend(Base):
    __tablename__ = "campaign_sends"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True)
    recipient_email = Column(String, index=True)
    sent_at = Column(DateTime, default=datetime.utcnow)
    opened = Column(Boolean, default=False)
    opened_at = Column(DateTime, nullable=True)
    bounced = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="campaign_sends")
    user = relationship("User", back_populates="campaign_sends")
    click_events = relationship("ClickEvent", back_populates="campaign_send")

