#!/usr/bin/env python
"""Script para adicionar a coluna full_name na tabela users"""

import sys
import os

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from sqlalchemy import text

def add_full_name_column():
    """Adicionar coluna full_name na tabela users"""
    db = SessionLocal()
    
    try:
        # Verificar se a coluna já existe
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='full_name'
        """))
        
        if result.fetchone():
            print("✓ Coluna full_name já existe")
            return
        
        # Adicionar coluna full_name
        db.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR"))
        db.commit()
        print("✓ Coluna full_name adicionada com sucesso!")
        
        # Atualizar registros existentes
        db.execute(text("""
            UPDATE users 
            SET full_name = SPLIT_PART(email, '@', 1) 
            WHERE full_name IS NULL
        """))
        db.commit()
        print("✓ Registros existentes atualizados!")
        
    except Exception as e:
        print(f"✗ Erro ao adicionar coluna: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_full_name_column()
