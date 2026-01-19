from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CampaignSendBase(BaseModel):
    campaign_id: int
    recipient_email: str


class CampaignSendCreate(CampaignSendBase):
    pass


class CampaignSendRead(CampaignSendBase):
    id: int
    sent_at: datetime
    opened: bool
    opened_at: Optional[datetime] = None
    bounced: bool
    created_at: datetime

    class Config:
        from_attributes = True
