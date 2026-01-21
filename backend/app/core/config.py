from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Ambiente
    debug: bool = True
    env: str = "development"
    
    # Segurança / Autenticação
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    
    # Banco de Dados
    database_url: str = "postgresql://postgres:password@localhost:5432/safeclicker"
    
    # SMTP - Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = "your-email@example.com"
    smtp_password: str = "your-app-password"
    smtp_from: str = "SafeClicker <your-email@example.com>"
    smtp_from_name: str | None = None
    
    # URLs da Aplicação
    app_base_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    
    # Campanhas / Tracking
    tracking_endpoint: str = "/campaigns/track"
    
    # Log
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()

