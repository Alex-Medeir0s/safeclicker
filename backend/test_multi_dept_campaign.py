import sqlite3

conn = sqlite3.connect('test.db')
cursor = conn.cursor()

print("\n📊 TESTE DE MÚLTIPLOS DEPARTAMENTOS")
print("=" * 60)

# Listar campanhas recentes
print("\n📋 CAMPANHAS ATUAIS:")
cursor.execute("""
    SELECT id, name, target_department_id, target_audience FROM campaigns 
    ORDER BY id DESC LIMIT 5
""")
for row in cursor.fetchall():
    print(f"\nID {row[0]}: {row[1]}")
    print(f"  Target Department ID: {row[2]}")
    print(f"  Target Audience: {row[3]}")

# Criar uma campanha de teste com múltiplos departamentos
print("\n\n✨ CRIANDO CAMPANHA PARA MÚLTIPLOS DEPARTAMENTOS:")
print("-" * 60)

cursor.execute("""
    INSERT INTO templates (name, subject, body, description, created_at, updated_at)
    VALUES ('Template Multi', 'Multi', '<h1>Multi</h1>', 'Multi dept', datetime('now'), datetime('now'))
""")
template_id = cursor.lastrowid

cursor.execute("""
    INSERT INTO campaigns 
    (name, subject, html_template, template_id, created_by, department_id, status, complexity, target_department_id, target_audience, created_at, updated_at)
    VALUES 
    ('Campanha Multi Departamentos', 'Teste', '<h1>Teste Multi</h1>', ?, 1, 1, 'draft', 'basico', 3, '3,4', datetime('now'), datetime('now'))
""", (template_id,))
campaign_id = cursor.lastrowid
conn.commit()

print(f"✅ Campanha criada: ID {campaign_id}")
print(f"   Target Department ID: 3 (primeira)")
print(f"   Target Audience: 3,4 (ambas)")

# Verificar quantos usuários tem em cada departamento
print("\n👥 USUÁRIOS NOS DEPARTAMENTOS 3 E 4:")
print("-" * 60)
cursor.execute("""
    SELECT d.id, d.name, COUNT(u.id) as count
    FROM departments d
    LEFT JOIN users u ON d.id = u.department_id AND u.is_active = 1
    WHERE d.id IN (3, 4)
    GROUP BY d.id, d.name
""")
total_users = 0
for row in cursor.fetchall():
    print(f"  Dept {row[0]} ({row[1]}): {row[2]} usuários")
    total_users += row[2]

print(f"\n  ✅ TOTAL: {total_users} usuários em ambos os departamentos")

# Simular o parsing da string
print("\n🔧 SIMULANDO PARSING DO BACKEND:")
print("-" * 60)
target_audience = "3,4"
department_ids = [int(d.strip()) for d in target_audience.split(",") if d.strip()]
print(f"  Target Audience: '{target_audience}'")
print(f"  Department IDs: {department_ids}")
print(f"  ✅ Sistema enviaria para usuários em: {', '.join([f'Dept {d}' for d in department_ids])}")

conn.close()
print("\n" + "=" * 60)
print("✅ TESTE CONCLUÍDO")
print("=" * 60 + "\n")
