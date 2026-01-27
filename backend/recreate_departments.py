#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para recriar departamentos limpos
"""

import sqlite3
import sys

DB_FILE = "test.db"

print("\n" + "="*60)
print("🔄 RECRIANDO DEPARTAMENTOS")
print("="*60)

conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

# 1. Listar departamentos atuais
print("\n📋 DEPARTAMENTOS ATUAIS:")
print("-" * 60)
cursor.execute("SELECT id, name, description FROM departments ORDER BY id")
depts = cursor.fetchall()
for dept in depts:
    print(f"  ID {dept[0]}: {dept[1]} - {dept[2]}")

# 2. Contar usuários por departamento
print("\n👥 USUÁRIOS POR DEPARTAMENTO:")
print("-" * 60)
cursor.execute("""
    SELECT d.id, d.name, COUNT(u.id) as count
    FROM departments d
    LEFT JOIN users u ON d.id = u.department_id
    GROUP BY d.id, d.name
    ORDER BY d.id
""")
for row in cursor.fetchall():
    print(f"  Dept {row[0]} ({row[1]}): {row[2]} usuários")

# 3. Contar campanhas por departamento
print("\n📧 CAMPANHAS COM TARGET_DEPARTMENT:")
print("-" * 60)
cursor.execute("""
    SELECT target_department_id, COUNT(*) as count
    FROM campaigns
    WHERE target_department_id IS NOT NULL
    GROUP BY target_department_id
    ORDER BY target_department_id
""")
campaigns = cursor.fetchall()
if campaigns:
    for row in campaigns:
        print(f"  Dept {row[0]}: {row[1]} campanhas")
else:
    print("  Nenhuma campanha com target_department_id definido")

# 4. Opções
print("\n" + "="*60)
print("OPÇÕES:")
print("="*60)
print("1. Apenas criar 3 novos departamentos com nomes em português")
print("2. Deletar todos e recriar zero")
print("3. Sair sem fazer nada")

choice = input("\nEscolha (1-3): ").strip()

if choice == "1":
    # Criar novos com IDs diferentes (começando de 10)
    print("\n✨ Criando novos departamentos...")
    cursor.execute("""
        INSERT INTO departments (id, name, description, created_at, updated_at)
        VALUES 
            (10, 'TI', 'Departamento de Tecnologia da Informação', datetime('now'), datetime('now')),
            (11, 'Financeiro', 'Departamento Financeiro', datetime('now'), datetime('now')),
            (12, 'RH', 'Departamento de Recursos Humanos', datetime('now'), datetime('now'))
    """)
    conn.commit()
    
    print("✅ Novos departamentos criados!")
    
    # Listar todos
    print("\n📋 TODOS OS DEPARTAMENTOS AGORA:")
    print("-" * 60)
    cursor.execute("SELECT id, name FROM departments ORDER BY id")
    for dept in cursor.fetchall():
        print(f"  ID {dept[0]}: {dept[1]}")
    
    print("\n⚠️  ATENÇÃO: Os usuários ainda estão nos departamentos antigos")
    print("Você precisa atualizar as campanhas para usar os novos IDs se necessário")

elif choice == "2":
    print("\n❌ Deletando todos os departamentos (CUIDADO!)")
    cursor.execute("DELETE FROM departments")
    conn.commit()
    
    print("✨ Criando 3 novos departamentos...")
    cursor.execute("""
        INSERT INTO departments (id, name, description, created_at, updated_at)
        VALUES 
            (1, 'TI', 'Departamento de Tecnologia da Informação', datetime('now'), datetime('now')),
            (2, 'Financeiro', 'Departamento Financeiro', datetime('now'), datetime('now')),
            (3, 'RH', 'Departamento de Recursos Humanos', datetime('now'), datetime('now'))
    """)
    conn.commit()
    
    print("✅ Departamentos recriados com IDs 1, 2, 3!")
    
    print("\n⚠️  ATENÇÃO: Usuários e campanhas podem ter sido afetados!")
    
    # Listar
    print("\n📋 DEPARTAMENTOS ATUAIS:")
    print("-" * 60)
    cursor.execute("SELECT id, name FROM departments ORDER BY id")
    for dept in cursor.fetchall():
        print(f"  ID {dept[0]}: {dept[1]}")

else:
    print("\n⏭️  Nenhuma ação realizada")

conn.close()
print("\n" + "="*60)
