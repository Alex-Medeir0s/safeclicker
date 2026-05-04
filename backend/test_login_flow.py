import hashlib
from sqlalchemy import func
from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()

# Simular o que o endpoint faz
request_email = "alexmedeiroskbs@gmail.com"
request_password = "123456789"

email_normalized = request_email.strip().lower()
print(f"Email fornecido: {request_email}")
print(f"Email normalizado: {email_normalized}")

# Query exatamente como no endpoint
user = (
    db.query(User)
    .filter(func.lower(User.email) == email_normalized)
    .first()
)

if not user:
    print("❌ Usuário não encontrado!")
else:
    print(f"✅ Usuário encontrado: {user.email}")
    print(f"  Nome: {user.full_name}")
    print(f"  Hash armazenado: {user.hashed_password}")
    print(f"  Hash length: {len(user.hashed_password)}")
    print(f"  All hex chars: {all(c in '0123456789abcdef' for c in user.hashed_password)}")
    
    # Testar a verificação
    password_valid = False
    
    if len(user.hashed_password) == 64 and all(c in '0123456789abcdef' for c in user.hashed_password):
        print(f"\n  → Usando SHA256 verify")
        password_hash = hashlib.sha256(request_password.encode()).hexdigest()
        print(f"  Hash calculado: {password_hash}")
        password_valid = password_hash == user.hashed_password
        print(f"  Result: {password_valid}")
    else:
        print(f"\n  → Usando bcrypt verify (não deveria chegar aqui)")

db.close()
