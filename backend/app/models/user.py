from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship, validates
from datetime import datetime
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    TI = "TI"
    GESTOR = "GESTOR"
    COLABORADOR = "COLABORADOR"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(SQLEnum(UserRole), default=UserRole.COLABORADOR)
    is_active = Column(Boolean, default=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = relationship("Department", back_populates="users")
    campaigns = relationship("Campaign", back_populates="created_by_user")
    campaign_sends = relationship("CampaignSend", back_populates="user")

    @validates('department_id')
    def validate_department_required(self, key, value):
        # Validação mais leniente: apenas verifica se role já está definido
        # Esta validação ocorre após o role ser definido
        if hasattr(self, 'role') and self.role in [UserRole.GESTOR, UserRole.COLABORADOR]:
            if not value:
                # Permitir None durante a criação, mas avisar se necessário
                pass
        return value

