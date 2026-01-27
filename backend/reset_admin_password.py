#!/usr/bin/env python
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()

# Atualizar senha do admin para "test123"
admin = db.query(User).filter(User.email == "admin@safeclicker.com").first()
if admin:
    admin.hashed_password = get_password_hash("test123")
    db.commit()
    print(f"Senha do {admin.email} resetada para 'test123'")
else:
    print("Admin user not found")
