import sys
sys.path.insert(0, 'd:\\safeclicker\\backend')

from app.core.config import get_settings
from sqlalchemy import create_engine

settings = get_settings()
print(f"DATABASE_URL: {settings.database_url}")

try:
    engine = create_engine(
        settings.database_url,
        echo=False,
        pool_pre_ping=True,
        pool_size=1,
        max_overflow=0,
        connect_args={
            'connect_timeout': 5,
            'options': '-c statement_timeout=5000'
        }
    )
    conn = engine.connect()
    print("✅ Conexão ao PostgreSQL bem-sucedida!")
    
    # Tentar executar uma query
    from sqlalchemy import text
    result = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
    print(f"Usuários no PostgreSQL: {result}")
    
    conn.close()
except Exception as e:
    import traceback
    print(f"❌ Erro ao conectar ao PostgreSQL:")
    print(f"Erro: {e}")
    print(f"Traceback: {traceback.format_exc()}")
