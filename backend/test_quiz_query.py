import sys
sys.path.insert(0, 'd:\\safeclicker\\backend')

from app.core.database import SessionLocal
from app.models.campaign_send import CampaignSend
from app.models.quiz import QuizResponse, Quiz
from app.models.user import User

db = SessionLocal()

# Buscar usuário colaborador
user = db.query(User).filter(User.email == "safeclicker.tcc@gmail.com").first()
print(f"User: {user.full_name} (ID: {user.id})")

# Query 1: Sem join, só QuizResponse
print("\n=== Query 1: Sem join ===")
responses_no_join = db.query(QuizResponse).join(
    CampaignSend, QuizResponse.campaign_send_id == CampaignSend.id
).filter(CampaignSend.user_id == user.id).all()

print(f"Respostas sem join Quiz: {len(responses_no_join)}")
for resp in responses_no_join:
    print(f"  - ID: {resp.id}, Quiz ID: {resp.quiz_id}, Campaign Send ID: {resp.campaign_send_id}")

# Query 2: Com join Quiz
print("\n=== Query 2: Com join Quiz ===")
responses_with_join = (
    db.query(QuizResponse)
    .join(CampaignSend, QuizResponse.campaign_send_id == CampaignSend.id)
    .join(Quiz, QuizResponse.quiz_id == Quiz.id)
    .filter(CampaignSend.user_id == user.id)
    .all()
)

print(f"Respostas com join Quiz: {len(responses_with_join)}")

# Query 3: Verificar se Quiz existe
print("\n=== Query 3: Quiz existe? ===")
quiz = db.query(Quiz).filter(Quiz.id == 11).first()
print(f"Quiz ID 11: {quiz}")
if quiz:
    print(f"  - Title: {quiz.title}")
    print(f"  - Category: {quiz.category}")

# Query 4: Verificar relationship
print("\n=== Query 4: Verificar relacionamento ===")
response = db.query(QuizResponse).filter(QuizResponse.id == responses_no_join[0].id).first() if responses_no_join else None
if response:
    print(f"Response: {response}")
    print(f"Response.quiz: {response.quiz}")
    print(f"Response.campaign_send: {response.campaign_send}")

db.close()
