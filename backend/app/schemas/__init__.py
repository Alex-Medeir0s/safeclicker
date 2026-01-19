from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.schemas.campaign import CampaignCreate, CampaignRead, CampaignUpdate
from app.schemas.template import TemplateCreate, TemplateRead
from app.schemas.department import DepartmentCreate, DepartmentRead
from app.schemas.campaign_send import CampaignSendRead, CampaignSendCreate
from app.schemas.click_event import ClickEventRead

__all__ = [
    "UserCreate",
    "UserRead",
    "UserUpdate",
    "CampaignCreate",
    "CampaignRead",
    "CampaignUpdate",
    "TemplateCreate",
    "TemplateRead",
    "DepartmentCreate",
    "DepartmentRead",
    "CampaignSendRead",
    "CampaignSendCreate",
    "ClickEventRead",
]

