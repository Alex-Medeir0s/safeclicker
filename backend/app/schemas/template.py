from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TemplateBase(BaseModel):
    name: str
    subject: str
    body: str
    description: Optional[str] = None


class TemplateCreate(TemplateBase):
    pass


class TemplateRead(TemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
