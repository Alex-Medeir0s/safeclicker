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

# Buscar departamentos
response = requests.get(
    "http://127.0.0.1:8000/departments/",
    headers=headers
)

print("Status:", response.status_code)
print("Departamentos retornados:")
for dept in response.json():
    print(f"  ID {dept['id']}: {dept['name']}")
    
print(f"\nTotal: {len(response.json())} departamentos")
