from app.core.database import SessionLocal, engine, Base
from app.models.department import Department
from app.models.user import User, UserRole
from app.core.security import get_password_hash

# Criar tabelas
Base.metadata.create_all(bind=engine)
print("✓ Tabelas criadas")

db = SessionLocal()

# Criar departamentos
depts = [
    Department(name='TI'),
    Department(name='Financeiro'),
    Department(name='RH')
]

for dept in depts:
    existing = db.query(Department).filter_by(name=dept.name).first()
    if not existing:
        db.add(dept)
        db.commit()
        print(f'✓ Departamento {dept.name} criado')
    else:
        print(f'✓ Departamento {dept.name} já existe')

# Criar usuário admin
dept_ti = db.query(Department).filter_by(name='TI').first()

users = [
    User(
        email='admin@safeclicker.com',
        full_name='Admin TI',
        hashed_password=get_password_hash('admin123'),
        role=UserRole.TI,
        department_id=dept_ti.id
    ),
    User(
        email='gestor@financeiro.com',
        full_name='Gestor Financeiro',
        hashed_password=get_password_hash('gestor123'),
        role=UserRole.GESTOR,
        department_id=db.query(Department).filter_by(name='Financeiro').first().id
    ),
    User(
        email='colaborador@rh.com',
        full_name='Colaborador RH',
        hashed_password=get_password_hash('colab123'),
        role=UserRole.COLABORADOR,
        department_id=db.query(Department).filter_by(name='RH').first().id
    )
]

for user in users:
    existing = db.query(User).filter_by(email=user.email).first()
    if not existing:
        db.add(user)
        db.commit()
        print(f'✓ Usuário {user.email} criado')
    else:
        print(f'✓ Usuário {user.email} já existe')

db.close()
print("\n✅ Banco PostgreSQL configurado com sucesso!")
print("\n📋 Credenciais criadas:")
print("  TI: admin@safeclicker.com / admin123")
print("  Gestor: gestor@financeiro.com / gestor123")
print("  Colaborador: colaborador@rh.com / colab123")
