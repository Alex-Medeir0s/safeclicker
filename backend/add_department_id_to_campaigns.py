#!/usr/bin/env python
"""Script para adicionar coluna department_id na tabela campaigns"""

import sys
import os

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from sqlalchemy import text

def add_department_id_column():
    """Adicionar coluna department_id se não existir"""
    db = SessionLocal()
    
    try:
        # Verificar se a coluna já existe
        result = db.execute(text("PRAGMA table_info(campaigns)"))
        columns = [row[1] for row in result]
        
        if 'department_id' not in columns:
            db.execute(text("ALTER TABLE campaigns ADD COLUMN department_id INTEGER"))
            print("✓ Coluna 'department_id' adicionada à tabela campaigns!")
        else:
            print("✓ Coluna 'department_id' já existe na tabela campaigns")
        
        db.commit()
        print("✓ Migração concluída!")
            
    except Exception as e:
        print(f"✗ Erro ao adicionar coluna: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_department_id_column()
