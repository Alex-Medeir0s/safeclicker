#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para verificar e limpar departamentos
"""

import sqlite3

DB_FILE = "test.db"

print("\n" + "="*60)
print("🔍 ANÁLISE DE DEPARTAMENTOS E REFERÊNCIAS")
print("="*60)

conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

# 1. Listar departamentos atuais
print("\n📋 DEPARTAMENTOS ATUAIS:")
print("-" * 60)
cursor.execute("SELECT id, name, description FROM departments ORDER BY id")
depts = cursor.fetchall()
for dept in depts:
    print(f"  ID {dept[0]}: {dept[1]}")

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
    SELECT d.id, d.name, COUNT(c.id) as count
    FROM departments d
    LEFT JOIN campaigns c ON d.id = c.target_department_id
    GROUP BY d.id, d.name
    ORDER BY d.id
""")
for row in cursor.fetchall():
    if row[2] > 0:
        print(f"  Dept {row[0]} ({row[1]}): {row[2]} campanhas")

print("\n" + "="*60)
print("✅ ANÁLISE CONCLUÍDA")
print("="*60)

conn.close()
