#!/usr/bin/env python
"""Script para criar um usuário de teste no banco de dados"""

import sys
import os

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.models.user import User

def create_test_user():
    """Criar usuário de teste"""
    # Criar tabelas
    Base.metadata.create_all(bind=engine)
    
    # Criar sessão
    db = SessionLocal()
    
    try:
        # Verificar se usuário já existe
        user = db.query(User).filter(User.email == "admin@safeclicker.com").first()
        
        if user:
            print("✓ Usuário já existe: admin@safeclicker.com")
        else:
            # Criar novo usuário
            new_user = User(
                email="admin@safeclicker.com",
                full_name="Admin User",
                hashed_password="admin123",
                is_active=True
            )
            db.add(new_user)
            db.commit()
            print("✓ Usuário criado com sucesso!")
            print(f"  Email: admin@safeclicker.com")
            print(f"  Senha: admin123")
            
    except Exception as e:
        print(f"✗ Erro ao criar usuário: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
