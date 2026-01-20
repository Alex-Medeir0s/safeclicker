#!/usr/bin/env python
"""Script para sincronizar o schema do banco de dados com os modelos"""

import sys
import os

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from sqlalchemy import text

def sync_database_schema():
    """Sincronizar schema do banco de dados"""
    db = SessionLocal()
    
    try:
        # Lista de colunas que devem existir na tabela users
        columns_to_add = [
            ("full_name", "VARCHAR"),
            ("hashed_password", "VARCHAR"),
            ("role", "VARCHAR DEFAULT 'colaborador'"),
            ("is_active", "BOOLEAN DEFAULT TRUE"),
            ("department_id", "INTEGER"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        ]
        
        for column_name, column_type in columns_to_add:
            # Verificar se a coluna já existe
            result = db.execute(text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='{column_name}'
            """))
            
            if result.fetchone():
                print(f"✓ Coluna {column_name} já existe")
            else:
                # Adicionar coluna
                db.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
                db.commit()
                print(f"✓ Coluna {column_name} adicionada com sucesso!")
        
        # Atualizar full_name para registros que não têm
        db.execute(text("""
            UPDATE users 
            SET full_name = SPLIT_PART(email, '@', 1) 
            WHERE full_name IS NULL
        """))
        db.commit()
        
        print("\n✅ Schema sincronizado com sucesso!")
        
    except Exception as e:
        print(f"✗ Erro ao sincronizar schema: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    sync_database_schema()
