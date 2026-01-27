#!/usr/bin/env python
import requests

# Login
login_response = requests.post(
    "http://127.0.0.1:8000/auth/login",
    json={"email": "admin@safeclicker.com", "password": "test123"}
)

token = login_response.json()["token"]

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Buscar departamento 1 para saber quantos usuários tem
dept_response = requests.get(
    "http://127.0.0.1:8000/departments/",
    headers=headers
)

print("=== DEPARTAMENTOS ===")
for dept in dept_response.json():
    print(f"ID {dept['id']}: {dept['name']}")

print("\n=== USUÁRIOS ===")
users_response = requests.get(
    "http://127.0.0.1:8000/users/",
    headers=headers
)

for user in users_response.json():
    print(f"ID {user['id']}: {user['email']} - Dept: {user['department_id']}, Role: {user['role']}, Active: {user.get('is_active', True)}")

# Buscar campanhas
print("\n=== CAMPANHAS ===")
campaigns_response = requests.get(
    "http://127.0.0.1:8000/campaigns/",
    headers=headers
)

for camp in campaigns_response.json():
    print(f"ID {camp['id']}: {camp['name']} - Target Dept: {camp.get('target_department_id')}")

# Buscar campaign_sends para campanha 1
print("\n=== CAMPAIGN SENDS (Campanha 1) ===")
try:
    # Endpoint para buscar campaign_sends pode não existir, vamos ver
    sends_response = requests.get(
        "http://127.0.0.1:8000/campaigns/1/sends",
        headers=headers
    )
    if sends_response.status_code == 404:
        print("Endpoint não existe, checando direto no banco...")
    else:
        print(f"Status: {sends_response.status_code}")
        print(sends_response.json())
except:
    print("Erro ao buscar campaign_sends")
