#!/usr/bin/env python
"""Migração: cria tabelas de quiz e adiciona quiz_id em campaigns.

Compatível com PostgreSQL (information_schema). As tabelas novas (quizzes,
quiz_questions, quiz_responses) são criadas automaticamente pelo
Base.metadata.create_all() ao subir a aplicação; este script apenas
garante que a coluna quiz_id existe em campaigns.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from sqlalchemy import text

# Garante que os models sejam carregados (cria tabelas novas)
import app.models  # noqa: F401


def add_quiz_id_column():
    db = SessionLocal()
    try:
        # Cria todas as tabelas que ainda não existirem (Quiz, QuizQuestion, QuizResponse)
        Base.metadata.create_all(bind=engine)
        print("✓ Tabelas de quiz garantidas (criadas se não existiam)")

        result = db.execute(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'campaigns' AND column_name = 'quiz_id'"
            )
        ).fetchone()

        if not result:
            db.execute(
                text(
                    "ALTER TABLE campaigns ADD COLUMN quiz_id INTEGER "
                    "REFERENCES quizzes(id)"
                )
            )
            db.commit()
            print("✓ Coluna 'quiz_id' adicionada em campaigns")
        else:
            print("✓ Coluna 'quiz_id' já existe em campaigns")

        print("✓ Migração concluída")
    except Exception as exc:
        db.rollback()
        print(f"✗ Erro: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    add_quiz_id_column()
