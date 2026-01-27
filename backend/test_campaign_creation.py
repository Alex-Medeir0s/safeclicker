#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script para testar criação de campanha com target_department_id
"""

import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

print("\n" + "="*60)
print("🧪 TESTE DE CRIAÇÃO DE CAMPANHA")
print("="*60)

# 1. Fazer login
print("\n1️⃣ AUTENTICAÇÃO:")
print("-" * 60)
session = requests.Session()
login_response = session.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@safeclicker.com",
    "password": "admin123"
})

if login_response.status_code == 200:
    token = login_response.json().get("access_token")
    session.headers.update({"Authorization": f"Bearer {token}"})
    print("✅ Login realizado!")
else:
    print(f"❌ Erro: {login_response.status_code}")
    print(login_response.text)
    sys.exit(1)

# 2. Criar template
print("\n2️⃣ CRIANDO TEMPLATE:")
print("-" * 60)
template_resp = session.post(f"{BASE_URL}/templates", json={
    "name": f"Test Template",
    "subject": "Test",
    "body": "<h1>Teste</h1>",
    "description": "Teste"
})
if template_resp.status_code == 200:
    template_id = template_resp.json()["id"]
    print(f"✅ Template criado: ID {template_id}")
else:
    print(f"❌ Erro: {template_resp.text}")
    sys.exit(1)

# 3. Criar campanha para departamento 2 (financeiro)
print("\n3️⃣ CRIANDO CAMPANHA PARA FINANCEIRO:")
print("-" * 60)
campaign_resp = session.post(f"{BASE_URL}/campaigns", json={
    "name": "Teste Financeiro",
    "subject": "Teste",
    "html_template": "<h1>Teste</h1>",
    "template_id": template_id,
    "status": "draft",
    "target_department_id": 2,  # Financeiro
    "target_audience": "2",
    "complexity": "basico"
})

if campaign_resp.status_code == 200:
    campaign = campaign_resp.json()
    print(f"✅ Campanha criada: ID {campaign['id']}")
    print(f"   Target Department ID: {campaign.get('target_department_id')}")
    print(f"   Department ID: {campaign.get('department_id')}")
    campaign_id = campaign['id']
else:
    print(f"❌ Erro: {campaign_resp.status_code}")
    print(campaign_resp.text)
    sys.exit(1)

# 4. Listar campanhas e verificar
print("\n4️⃣ VERIFICANDO CAMPANHAS:")
print("-" * 60)
list_resp = session.get(f"{BASE_URL}/campaigns/")
if list_resp.status_code == 200:
    campaigns = list_resp.json()
    print(f"Total de campanhas: {len(campaigns)}\n")
    for c in campaigns[-3:]:  # Últimas 3
        print(f"ID {c['id']}: {c['name']}")
        print(f"  - Target Dept: {c.get('target_department_id')}")
        print(f"  - Dept: {c.get('department_id')}")
else:
    print(f"❌ Erro: {list_resp.text}")

print("\n" + "="*60)
print("✅ TESTE CONCLUÍDO")
print("="*60 + "\n")
