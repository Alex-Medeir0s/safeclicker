from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ClickEventRead(BaseModel):
    id: int
    campaign_send_id: int
    link_url: str
    clicked_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
