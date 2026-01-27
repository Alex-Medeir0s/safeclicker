#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para testar se o envio de emails está usando os departamentos corretos.
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("\n" + "="*60)
print("🔍 VERIFICANDO DEPARTAMENTOS E ENVIO DE EMAILS")
print("="*60)

# 0. Fazer login
print("\n0️⃣ AUTENTICAÇÃO:")
print("-" * 60)
session = requests.Session()
login_response = session.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@safeclicker.com",
    "password": "admin123"
})
if login_response.status_code == 200:
    print("✅ Login realizado com sucesso")
    token = login_response.json().get("access_token")
    session.headers.update({"Authorization": f"Bearer {token}"})
else:
    print(f"❌ Erro ao fazer login: {login_response.status_code}")
    print(login_response.text)

# 1. Listar departamentos
print("\n1️⃣ DEPARTAMENTOS EXISTENTES:")
print("-" * 60)
response = session.get(f"{BASE_URL}/departments/")
if response.status_code == 200:
    departments = response.json()
    for dept in departments:
        print(f"  ID {dept['id']}: {dept['name']} - {dept.get('description', 'sem descrição')}")
else:
    print(f"❌ Erro ao buscar departamentos: {response.status_code}")
    exit(1)

# 2. Listar usuários por departamento
print("\n2️⃣ USUÁRIOS POR DEPARTAMENTO:")
print("-" * 60)
response = session.get(f"{BASE_URL}/users/")
if response.status_code == 200:
    users = response.json()
    dept_users = {}
    for user in users:
        dept_id = user.get('department_id')
        if dept_id not in dept_users:
            dept_users[dept_id] = []
        dept_users[dept_id].append(user)
    
    for dept in departments:
        dept_id = dept['id']
        user_list = dept_users.get(dept_id, [])
        print(f"\n  📌 Departamento {dept_id} ({dept['name']}): {len(user_list)} usuários")
        for user in user_list:
            print(f"     - {user['email']} ({user['role']})")
else:
    print(f"❌ Erro ao buscar usuários: {response.status_code}")

# 3. Listar campanhas
print("\n3️⃣ CAMPANHAS EXISTENTES:")
print("-" * 60)
response = session.get(f"{BASE_URL}/campaigns/")
if response.status_code == 200:
    campaigns = response.json()
    print(f"Total: {len(campaigns)} campanhas\n")
    for campaign in campaigns:
        print(f"  ID {campaign['id']}: {campaign['name']}")
        print(f"    Status: {campaign['status']}")
        print(f"    Target Department ID: {campaign.get('target_department_id', 'N/A')}")
        print(f"    Target Audience: {campaign.get('target_audience', 'N/A')}")
        print()
else:
    print(f"❌ Erro ao buscar campanhas: {response.status_code}")

# 4. Verificar CampaignSends (envios)
print("\n4️⃣ ENVIOS DE CAMPANHA (CAMPAIGN_SENDS):")
print("-" * 60)
try:
    import sqlite3
    conn = sqlite3.connect("test.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT cs.id, cs.campaign_id, cs.user_id, u.email, c.name, c.target_department_id
        FROM campaign_sends cs
        JOIN users u ON cs.user_id = u.id
        JOIN campaigns c ON cs.campaign_id = c.id
        ORDER BY c.id DESC, u.email
    """)
    
    results = cursor.fetchall()
    if results:
        print(f"Total de envios: {len(results)}\n")
        current_campaign_id = None
        for row in results:
            cs_id, camp_id, user_id, email, camp_name, target_dept = row
            if camp_id != current_campaign_id:
                current_campaign_id = camp_id
                print(f"📧 Campanha {camp_id} ({camp_name}) - Target Dept: {target_dept}")
            print(f"   ✓ Enviado para: {email}")
    else:
        print("⚠️  Nenhum envio registrado ainda")
    
    conn.close()
except Exception as e:
    print(f"❌ Erro ao consultar banco: {e}")

print("\n" + "="*60)
print("✅ TESTE CONCLUÍDO")
print("="*60)
