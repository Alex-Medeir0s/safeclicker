#!/usr/bin/env python
"""Script para adicionar a coluna role na tabela users"""

import sys
import os

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from sqlalchemy import text

def add_role_column():
    """Adicionar coluna role se não existir"""
    db = SessionLocal()
    
    try:
        # Verificar se a coluna já existe
        result = db.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result]
        
        if 'role' in columns:
            print("✓ Coluna 'role' já existe")
        else:
            # Adicionar coluna role
            db.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'colaborador'"))
            db.commit()
            print("✓ Coluna 'role' adicionada com sucesso!")
            
            # Atualizar usuários existentes
            db.execute(text("UPDATE users SET role = 'admin' WHERE email = 'admin@safeclicker.com'"))
            db.commit()
            print("✓ Usuários existentes atualizados!")
            
    except Exception as e:
        print(f"✗ Erro ao adicionar coluna: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_role_column()
