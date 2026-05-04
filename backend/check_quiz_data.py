import sys
sys.path.insert(0, 'd:\\safeclicker\\backend')

from app.core.database import SessionLocal
from app.models.campaign_send import CampaignSend
from app.models.quiz import QuizResponse
from app.models.user import User

db = SessionLocal()

# Buscar usuário colaborador
users = db.query(User).filter(User.role == "COLABORADOR").all()
print(f"Total de usuários com role COLABORADOR: {len(users)}")

for user in users:
    print(f"\n=== Usuário: {user.full_name} ({user.email}) ===")
    print(f"User ID: {user.id}")
    
    # Buscar CampaignSends para esse usuário
    sends = db.query(CampaignSend).filter(CampaignSend.user_id == user.id).all()
    print(f"CampaignSends: {len(sends)}")
    
    for send in sends:
        print(f"  - ID: {send.id}, Campaign: {send.campaign.name if send.campaign else 'None'}, Token: {send.token[:10]}...")
        
        # Buscar respostas para esse CampaignSend
        responses = db.query(QuizResponse).filter(QuizResponse.campaign_send_id == send.id).all()
        print(f"    QuizResponses: {len(responses)}")
        
        for resp in responses:
            print(f"      - Quiz ID: {resp.quiz_id}, Points: {resp.points_earned}, Submitted: {resp.submitted_at}")

db.close()
