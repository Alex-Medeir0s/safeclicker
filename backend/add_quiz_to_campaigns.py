#!/usr/bin/env python
"""Migração: cria tabelas de quiz e adiciona quiz_id em campaigns.

Compatível com PostgreSQL (information_schema). As tabelas novas (quizzes,
quiz_questions, quiz_responses) são criadas automaticamente pelo
Base.metadata.create_all(); este script garante que quiz_id existe em
campaigns e que quiz_questions tem as colunas difficulty/xp (mudança
posterior, dificuldade por pergunta em vez de por quiz).
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from sqlalchemy import text

# Garante que os models sejam carregados (cria tabelas novas)
import app.models  # noqa: F401


def column_exists(db, table: str, column: str) -> bool:
    row = db.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = :table AND column_name = :column"
        ),
        {"table": table, "column": column},
    ).fetchone()
    return row is not None


def migrate():
    db = SessionLocal()
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Tabelas de quiz garantidas (criadas se não existiam)")

        # campaigns.quiz_id
        if not column_exists(db, "campaigns", "quiz_id"):
            db.execute(
                text(
                    "ALTER TABLE campaigns ADD COLUMN quiz_id INTEGER "
                    "REFERENCES quizzes(id)"
                )
            )
            print("✓ campaigns.quiz_id adicionada")
        else:
            print("✓ campaigns.quiz_id já existia")

        # quiz_questions.difficulty
        if not column_exists(db, "quiz_questions", "difficulty"):
            db.execute(text("ALTER TABLE quiz_questions ADD COLUMN difficulty VARCHAR"))
            print("✓ quiz_questions.difficulty adicionada")
        else:
            print("✓ quiz_questions.difficulty já existia")

        # quiz_questions.xp
        if not column_exists(db, "quiz_questions", "xp"):
            db.execute(text("ALTER TABLE quiz_questions ADD COLUMN xp INTEGER"))
            print("✓ quiz_questions.xp adicionada")
        else:
            print("✓ quiz_questions.xp já existia")

        # Relaxa NOT NULL em quizzes.difficulty / quizzes.xp (caso tenham sido criadas antes)
        db.execute(text("ALTER TABLE quizzes ALTER COLUMN difficulty DROP NOT NULL"))
        db.execute(text("ALTER TABLE quizzes ALTER COLUMN xp DROP NOT NULL"))
        print("✓ quizzes.difficulty / xp agora aceitam NULL")

        db.commit()
        print("✓ Migração concluída")
    except Exception as exc:
        db.rollback()
        print(f"✗ Erro: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
