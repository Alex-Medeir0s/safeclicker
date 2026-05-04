from app.core.database import SessionLocal
from app.core.config import get_settings

settings = get_settings()
print(f"DATABASE_URL configurada: {settings.database_url}")

db = SessionLocal()
# Tentar executar uma query simples para confirmar conexão
try:
    result = db.execute("SELECT 1").scalar()
    print(f"Conexão ao banco: OK")
except Exception as e:
    print(f"Erro ao conectar: {e}")

# Listar usuários
from app.models.user import User
users = db.query(User).all()
print(f"\nTotal de usuários no banco: {len(users)}")
for u in users:
    print(f"  - {u.email} ({u.full_name})")

db.close()
