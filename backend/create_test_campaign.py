import sqlite3

# Criar nova campanha de teste
conn = sqlite3.connect('test.db')
cursor = conn.cursor()

# Primeiro, criar um template
print("Criando template de teste...")
cursor.execute("""
    INSERT INTO templates (name, subject, body, description, created_at, updated_at)
    VALUES ('Template Teste', 'Teste Financeiro', '<h1>Teste</h1>', 'Teste', datetime('now'), datetime('now'))
""")
template_id = cursor.lastrowid
print(f"✅ Template criado: ID {template_id}")

# Criar campanha com target_department_id = 4 (Financeiro)
print("\nCriando campanha para Financeiro (Dept 4)...")
cursor.execute("""
    INSERT INTO campaigns 
    (name, subject, html_template, template_id, created_by, department_id, status, complexity, target_department_id, created_at, updated_at)
    VALUES 
    ('Teste Financeiro', 'Teste', '<h1>Teste Financeiro</h1>', ?, 1, 1, 'draft', 'basico', 4, datetime('now'), datetime('now'))
""", (template_id,))
campaign_id = cursor.lastrowid
conn.commit()
print(f"✅ Campanha criada: ID {campaign_id}")

# Verificar
print("\nVerificando campanha...")
cursor.execute("""
    SELECT id, name, target_department_id, department_id FROM campaigns WHERE id = ?
""", (campaign_id,))
row = cursor.fetchone()
print(f"  ID {row[0]}: {row[1]}")
print(f"    Target Department ID: {row[2]} (esperado: 4)")
print(f"    Department ID: {row[3]}")

# Verificar quantos usuários tem no departamento 4
cursor.execute("SELECT COUNT(*) FROM users WHERE department_id = 4 AND is_active = 1")
count = cursor.fetchone()[0]
print(f"\n  Usuários ativos no Dept 4: {count}")

conn.close()
print("\n✅ Teste concluído!")
