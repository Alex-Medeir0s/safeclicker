#!/usr/bin/env python
"""Script para adicionar campos complexity e trigger na tabela campaigns"""

import sys
import os

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from sqlalchemy import text

def add_campaign_columns():
    """Adicionar colunas se não existirem"""
    db = SessionLocal()
    
    try:
        # Verificar se as colunas já existem
        result = db.execute(text("PRAGMA table_info(campaigns)"))
        columns = [row[1] for row in result]
        
        if 'complexity' not in columns:
            db.execute(text("ALTER TABLE campaigns ADD COLUMN complexity VARCHAR DEFAULT 'basico'"))
            print("✓ Coluna 'complexity' adicionada!")
        else:
            print("✓ Coluna 'complexity' já existe")
            
        if 'trigger' not in columns:
            db.execute(text("ALTER TABLE campaigns ADD COLUMN trigger VARCHAR"))
            print("✓ Coluna 'trigger' adicionada!")
        else:
            print("✓ Coluna 'trigger' já existe")
        
        db.commit()
        print("✓ Migração concluída!")
            
    except Exception as e:
        print(f"✗ Erro ao adicionar colunas: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_campaign_columns()
