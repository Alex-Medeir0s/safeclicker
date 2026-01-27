from app.core.database import SessionLocal
from app.models.user import User
from app.models.department import Department

db = SessionLocal()

depts = db.query(Department).all()
print('Departamentos:')
for d in depts:
    print(f'  ID {d.id}: {d.name}')

print()
print('Usuários ativos por departamento:')

for d in depts:
    users = db.query(User).filter(User.department_id == d.id, User.is_active == True).all()
    print(f'  Dept {d.id} ({d.name}): {len(users)} users')
    for u in users:
        print(f'    - {u.email} ({u.role})')

users_none = db.query(User).filter(User.department_id == None, User.is_active == True).all()
print(f'  Dept None: {len(users_none)} users')
for u in users_none:
    print(f'    - {u.email} ({u.role})')


