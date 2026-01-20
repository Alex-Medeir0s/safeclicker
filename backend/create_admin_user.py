from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()

# Verificar se já existe
existing = db.query(User).filter(User.email == 'admin@empresa.com').first()
if not existing:
    user = User(
        email='admin@empresa.com',
        full_name='Admin User',
        hashed_password='admin123',
        role='admin',
        is_active=True,
        department_id=1
    )
    db.add(user)
    db.commit()
    print('✅ Usuário admin@empresa.com criado com sucesso')
else:
    print('✅ Usuário admin@empresa.com já existe')

db.close()
