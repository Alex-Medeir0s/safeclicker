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
    
    # SendGrid - Email API
    sendgrid_api_key: str = "SG_SUA_API_KEY_AQUI"
    sendgrid_from_email: str = "campanhas@safeclicker.local"
    sendgrid_template_id: str = "d-7c771bef5cac45ccb87edf64437cc73a"
    
    # URLs da Aplicação
    backend_base_url: str = "http://localhost:8000"
    frontend_base_url: str = "http://localhost:3000"
    
    # Campanhas / Tracking
    tracking_endpoint: str = "/track"
    
    # Log
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()

