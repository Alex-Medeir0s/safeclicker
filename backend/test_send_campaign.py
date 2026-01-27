#!/usr/bin/env python
import sqlite3
import os
import sys

# Simular o envio de emails (sem realmente enviar)
conn = sqlite3.connect('test.db')
cursor = conn.cursor()

print("\n📧 TESTANDO ENVIO DE CAMPANHA")
print("=" * 60)

# Pegar a campanha 2
cursor.execute("SELECT id, name, target_department_id, html_template FROM campaigns WHERE id = 2")
campaign = cursor.fetchone()
if not campaign:
    print("❌ Campanha 2 não encontrada")
    sys.exit(1)

campaign_id, campaign_name, target_dept_id, html = campaign
print(f"\n📌 Campanha: ID {campaign_id} ({campaign_name})")
print(f"   Target Department ID: {target_dept_id}")
print(f"   HTML: {html[:50] if html else 'N/A'}...")

# Buscar usuários do departamento alvo
print(f"\n👥 Buscando usuários do Departamento {target_dept_id}:")
cursor.execute("""
    SELECT id, email, role FROM users WHERE department_id = ? AND is_active = 1
""", (target_dept_id,))

users = cursor.fetchall()
if not users:
    print("   ❌ Nenhum usuário encontrado!")
else:
    print(f"   ✅ {len(users)} usuários encontrados:")
    for user in users:
        print(f"      - {user[1]} ({user[2]})")

# Simular criação de CampaignSend records
print(f"\n📤 Simulando envio para {len(users)} usuários...")
for user_id, email, role in users:
    print(f"   ✓ Enviaria para: {email}")

print("\n" + "=" * 60)
print("✅ TESTE CONCLUÍDO - Campanha 2 deveria enviar para Departamento 4")
print("=" * 60 + "\n")

conn.close()

print(f"Login Status: {login_response.status_code}")
print(f"Login Response: {login_response.json()}")

if login_response.status_code != 200:
    print(f"Login Error: {login_response.text}")
    exit(1)

token = login_response.json().get("access_token") or login_response.json().get("token")
print(f"Token obtido: {token[:50] if token else 'NOT FOUND'}...")

if not token:
    print("Token not found in response")
    exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Testar envio de campanha
response = requests.post(
    "http://127.0.0.1:8000/campaigns/1/send",
    headers=headers
)

print(f"\nStatus: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code != 200:
    try:
        print(f"\nError details: {response.json()}")
    except:
        print(f"\nError details: {response.text}")
