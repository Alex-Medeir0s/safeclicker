import sys
sys.path.insert(0, 'd:\\safeclicker\\backend')

import requests

# 1. Fazer login como colaborador
login_response = requests.post(
    'http://localhost:8000/auth/login',
    json={
        'email': 'safeclicker.tcc@gmail.com',
        'password': '123456789'
    }
)

print(f"Login status: {login_response.status_code}")
if login_response.status_code != 200:
    print(f"Login error: {login_response.json()}")
    sys.exit(1)

login_data = login_response.json()
token = login_data.get('token')
print(f"Token obtido: {token[:50]}...")

# 2. Chamar rota de user-responses com token
response = requests.get(
    'http://localhost:8000/campaigns/quiz/user-responses',
    headers={
        'Authorization': f'Bearer {token}'
    }
)

print(f"\nUser-responses status: {response.status_code}")
print(f"Response: {response.json()}")
