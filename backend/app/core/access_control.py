"""
Módulo de controle de acesso baseado em roles (RBAC) com escopo por departamento.

Implementa as regras de segregação de dados:
- TI: Acesso total sem filtros
- GESTOR: Acesso apenas ao próprio departamento
- COLABORADOR: Acesso apenas aos próprios dados
"""

from sqlalchemy.orm import Query
from app.models.user import User, UserRole
from app.models.campaign import Campaign
from app.models.campaign_send import CampaignSend
from typing import Type, TypeVar, Union
from sqlalchemy.ext.declarative import DeclarativeMeta

T = TypeVar('T')


def apply_scope(
    query: Query,
    model: Type[Union[User, Campaign, CampaignSend]],
    user: User
) -> Query:
    """
    Aplica filtros de escopo à query baseado na role do usuário.
    
    Args:
        query: Query SQLAlchemy a ser filtrada
        model: Model sobre o qual a query está sendo feita (User, Campaign, CampaignSend)
        user: Usuário autenticado com role e department_id
    
    Returns:
        Query filtrada conforme a role do usuário
    
    Regras:
        - TI: Retorna query sem filtro (acesso total)
        - GESTOR: Filtra por department_id do gestor
        - COLABORADOR: Filtra por user_id do colaborador
    """
    
    # TI tem acesso total
    if user.role == UserRole.TI:
        return query
    
    # GESTOR: filtra por departamento
    if user.role == UserRole.GESTOR:
        if not user.department_id:
            # Gestor sem departamento não vê nada (segurança)
            return query.filter(False)
        
        # Verificar qual model e aplicar filtro apropriado
        if model == User:
            return query.filter(User.department_id == user.department_id)
        elif model == Campaign:
            return query.filter(Campaign.department_id == user.department_id)
        elif model == CampaignSend:
            # CampaignSend: filtra por usuários do mesmo departamento
            return query.join(User, CampaignSend.user_id == User.id).filter(
                User.department_id == user.department_id
            )
    
    # COLABORADOR: filtra apenas seus próprios dados
    if user.role == UserRole.COLABORADOR:
        if model == User:
            # Colaborador só vê a si mesmo
            return query.filter(User.id == user.id)
        elif model == Campaign:
            # Colaborador vê campanhas do seu departamento
            if user.department_id:
                return query.filter(Campaign.department_id == user.department_id)
            else:
                return query.filter(False)
        elif model == CampaignSend:
            # Colaborador só vê seus próprios envios
            return query.filter(CampaignSend.user_id == user.id)
    
    # Fallback de segurança: se não for nenhuma role conhecida, bloqueia tudo
    return query.filter(False)


def check_resource_access(
    resource: Union[User, Campaign, CampaignSend],
    user: User
) -> bool:
    """
    Verifica se o usuário tem permissão para acessar um recurso específico.
    
    Args:
        resource: Recurso (User, Campaign ou CampaignSend) que está sendo acessado
        user: Usuário autenticado
    
    Returns:
        True se o usuário tem acesso, False caso contrário
    """
    
    # TI tem acesso total
    if user.role == UserRole.TI:
        return True
    
    # GESTOR: verifica se o recurso pertence ao mesmo departamento
    if user.role == UserRole.GESTOR:
        if not user.department_id:
            return False
        
        if isinstance(resource, User):
            return resource.department_id == user.department_id
        elif isinstance(resource, Campaign):
            return resource.department_id == user.department_id
        elif isinstance(resource, CampaignSend):
            # Verifica se o usuário alvo pertence ao mesmo departamento
            return resource.user.department_id == user.department_id
    
    # COLABORADOR: verifica se o recurso é dele
    if user.role == UserRole.COLABORADOR:
        if isinstance(resource, User):
            return resource.id == user.id
        elif isinstance(resource, Campaign):
            # Colaborador pode ver campanhas do seu departamento
            return resource.department_id == user.department_id if user.department_id else False
        elif isinstance(resource, CampaignSend):
            return resource.user_id == user.id
    
    return False
