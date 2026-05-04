from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

settings = get_settings()

# SQLite support
if settings.database_url.startswith("sqlite"):
    engine = create_engine(
        settings.database_url,
        echo=True if settings.debug else False,
        connect_args={"check_same_thread": False},
    )
else:
    # Tenta conectar ao PostgreSQL; se houver erro de encoding/conn, faz fallback para SQLite local (apenas dev)
    try:
        engine = create_engine(
            settings.database_url,
            echo=True if settings.debug else False,
            pool_pre_ping=True,
        )
        # Testar conexão básica
        conn = engine.connect()
        print(f"✅ PostgreSQL connection successful: {settings.database_url}")
        conn.close()
    except Exception as e:
        import traceback
        print(f"❌ Error connecting to PostgreSQL: {e}")
        print(f"Full traceback: {traceback.format_exc()}")
        fallback_url = "sqlite:///./test.db"
        print(f"⚠️ Falling back to SQLite DB at {fallback_url} for local development")
        engine = create_engine(
            fallback_url,
            echo=True if settings.debug else False,
            connect_args={"check_same_thread": False},
        )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

