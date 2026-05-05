from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

settings = get_settings()

try:
    engine = create_engine(
        settings.database_url,
        echo=True if settings.debug else False,
        pool_pre_ping=True,
    )
    conn = engine.connect()
    print(f"✅ PostgreSQL connection successful: {settings.database_url}")
    conn.close()
except Exception as e:
    import traceback

    print(f"❌ Error connecting to PostgreSQL: {e}")
    print(f"Full traceback: {traceback.format_exc()}")
    raise RuntimeError("Unable to connect to PostgreSQL using DATABASE_URL") from e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

