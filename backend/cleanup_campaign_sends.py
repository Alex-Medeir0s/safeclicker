#!/usr/bin/env python
from app.core.database import SessionLocal
from app.models.campaign_send import CampaignSend
from app.models.campaign import Campaign

db = SessionLocal()

# Deletar todos os campaign_sends antigos da campanha 1
db.query(CampaignSend).filter(CampaignSend.campaign_id == 1).delete()
db.commit()

# Resetar status da campanha para draft
campaign = db.query(Campaign).filter(Campaign.id == 1).first()
if campaign:
    campaign.status = "draft"
    db.commit()
    print(f"Campaign 1 resetada para 'draft'")

print("Campaign sends da campanha 1 deletados")
