"""
Script para criar usuários de teste com as novas roles (TI, GESTOR, COLABORADOR)
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.department import Department
# Temporariamente sem bcrypt - apenas para testes
# from app.core.security import get_password_hash

def simple_hash(password):
    """Hash simples para testes - NÃO USAR EM PRODUÇÃO"""
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

def create_test_users():
    db = SessionLocal()
    
    try:
        # Criar departamento se não existir
        dept = db.query(Department).filter(Department.name == "TI").first()
        if not dept:
            dept = Department(name="TI", description="Departamento de Tecnologia da Informação")
            db.add(dept)
            db.commit()
            db.refresh(dept)
            print(f"✅ Departamento criado: {dept.name} (ID: {dept.id})")
        else:
            print(f"ℹ️ Departamento já existe: {dept.name} (ID: {dept.id})")
        
        # Criar usuário TI
        ti_user = db.query(User).filter(User.email == "ti@safeclicker.com").first()
        if not ti_user:
            ti_user = User(
                email="ti@safeclicker.com",
                full_name="Administrador TI",
                role=UserRole.TI,
                department_id=None,  # TI não precisa de departamento
                hashed_password=simple_hash("senha123"),
                is_active=True
            )
            db.add(ti_user)
            db.commit()
            print("✅ Usuário TI criado: ti@safeclicker.com / senha123")
        else:
            print("ℹ️ Usuário TI já existe")
        
        # Criar usuário GESTOR
        gestor_user = db.query(User).filter(User.email == "gestor.ti@safeclicker.com").first()
        if not gestor_user:
            gestor_user = User(
                email="gestor.ti@safeclicker.com",
                full_name="Gestor TI",
                department_id=dept.id,
                role=UserRole.GESTOR,
                hashed_password=simple_hash("senha123"),
                is_active=True
            )
            db.add(gestor_user)
            db.commit()
            print("✅ Usuário GESTOR criado: gestor.ti@safeclicker.com / senha123")
        else:
            print("ℹ️ Usuário GESTOR já existe")
        
        # Criar usuário COLABORADOR
        colab_user = db.query(User).filter(User.email == "colaborador.ti@safeclicker.com").first()
        if not colab_user:
            colab_user = User(
                email="colaborador.ti@safeclicker.com",
                full_name="Colaborador TI",
                department_id=dept.id,
                role=UserRole.COLABORADOR,
                hashed_password=simple_hash("senha123"),
                is_active=True
            )
            db.add(colab_user)
            db.commit()
            print("✅ Usuário COLABORADOR criado: colaborador.ti@safeclicker.com / senha123")
        else:
            print("ℹ️ Usuário COLABORADOR já existe")
        
        print("\n" + "="*60)
        print("USUÁRIOS DE TESTE PRONTOS:")
        print("="*60)
        print("TI:          ti@safeclicker.com / senha123")
        print("GESTOR:      gestor.ti@safeclicker.com / senha123")
        print("COLABORADOR: colaborador.ti@safeclicker.com / senha123")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_test_users()
