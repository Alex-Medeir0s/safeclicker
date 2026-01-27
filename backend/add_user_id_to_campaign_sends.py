#!/usr/bin/env python
"""Script para adicionar coluna user_id na tabela campaign_sends"""

import sys
import os

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from sqlalchemy import text

def add_user_id_column():
    """Adicionar coluna user_id se não existir"""
    db = SessionLocal()
    
    try:
        # Verificar se a coluna já existe
        result = db.execute(text("PRAGMA table_info(campaign_sends)"))
        columns = [row[1] for row in result]
        
        if 'user_id' not in columns:
            db.execute(text("ALTER TABLE campaign_sends ADD COLUMN user_id INTEGER"))
            print("✓ Coluna 'user_id' adicionada à tabela campaign_sends!")
        else:
            print("✓ Coluna 'user_id' já existe na tabela campaign_sends")
        
        db.commit()
        print("✓ Migração concluída!")
            
    except Exception as e:
        print(f"✗ Erro ao adicionar coluna: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_user_id_column()
