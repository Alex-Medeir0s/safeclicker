import hashlib
from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()

email = "alexmedeiroskbs@gmail.com"
password = "123456789"

# Calcular hash SHA256 da senha fornecida
correct_hash = hashlib.sha256(password.encode()).hexdigest()
print(f"Email: {email}")
print(f"Senha: {password}")
print(f"Hash correto (SHA256): {correct_hash}")

# Buscar usuário
user = db.query(User).filter(User.email == email).first()

if user:
    print(f"\nUsuário encontrado:")
    print(f"  Nome: {user.full_name}")
    print(f"  Role: {user.role}")
    print(f"  Ativo: {user.is_active}")
    print(f"  Hash armazenado: {user.hashed_password}")
    print(f"  Hashes coincidem: {user.hashed_password == correct_hash}")
    
    if user.hashed_password != correct_hash:
        print(f"\n⚠️ Hash não coincide! Atualizando...")
        user.hashed_password = correct_hash
        db.commit()
        print(f"✅ Hash atualizado com sucesso!")
    else:
        print(f"\n✅ Hash já está correto!")
else:
    print(f"❌ Usuário não encontrado: {email}")

db.close()
