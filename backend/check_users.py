from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()
print(f"Total de usuários: {len(users)}\n")
for u in users[:10]:
    print(f"Email: {u.email}")
    print(f"  Nome: {u.full_name}")
    print(f"  Ativo: {u.is_active}")
    print(f"  Role: {u.role}")
    print(f"  Hash (primeiros 30 chars): {u.hashed_password[:30]}...")
    print()
db.close()
