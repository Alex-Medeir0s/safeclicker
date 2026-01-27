#!/usr/bin/env python
import requests
import json

# Login
login_response = requests.post(
    "http://127.0.0.1:8000/auth/login",
    json={"email": "admin@safeclicker.com", "password": "test123"}
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.json()}")
    exit(1)

token = login_response.json()["token"]

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Test: Create user with COLABORADOR role without department_id
user_data = {
    "email": "test.user@example.com",
    "full_name": "Test User",
    "role": "COLABORADOR",
    "password": "password123",
    "department_id": None
}

response = requests.post(
    "http://127.0.0.1:8000/users/",
    json=user_data,
    headers=headers
)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
