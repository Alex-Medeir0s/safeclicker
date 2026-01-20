from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CampaignBase(BaseModel):
    name: str
    subject: Optional[str] = None
    description: Optional[str] = None
    html_template: Optional[str] = None
    template_id: int
    status: str = "draft"
    complexity: Optional[str] = "basico"
    trigger: Optional[str] = None
    target_audience: Optional[str] = None
    target_department_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CampaignCreate(CampaignBase):
    pass


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    html_template: Optional[str] = None
    template_id: Optional[int] = None
    status: Optional[str] = None
    complexity: Optional[str] = None
    trigger: Optional[str] = None
    target_audience: Optional[str] = None
    target_department_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CampaignRead(CampaignBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

