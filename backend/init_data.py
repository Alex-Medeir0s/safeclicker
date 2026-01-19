"""
Script para inicializar o banco de dados com dados de exemplo.
Execute após o servidor estar rodando.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

# Verificar se a API está rodando
def check_health():
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"API Status: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Erro ao conectar com a API: {e}")
        return False


def create_sample_data():
    if not check_health():
        print("API não está rodando. Inicie o servidor primeiro.")
        return

    # Criar departamentos
    print("\n1. Criando departamentos...")
    departments = [
        {"name": "TI", "description": "Departamento de Tecnologia da Informação"},
        {"name": "RH", "description": "Departamento de Recursos Humanos"},
        {"name": "Financeiro", "description": "Departamento Financeiro"},
    ]
    
    dept_ids = []
    for dept in departments:
        try:
            response = requests.post(f"{BASE_URL}/departments", json=dept)
            if response.status_code == 200:
                dept_data = response.json()
                dept_ids.append(dept_data["id"])
                print(f"✓ Departamento criado: {dept['name']}")
        except Exception as e:
            print(f"✗ Erro ao criar departamento: {e}")

    # Criar usuários
    print("\n2. Criando usuários...")
    users = [
        {
            "email": "admin@safeclicker.com",
            "full_name": "Admin User",
            "department_id": dept_ids[0] if dept_ids else None,
            "password": "admin123",
        },
        {
            "email": "user1@safeclicker.com",
            "full_name": "User One",
            "department_id": dept_ids[1] if len(dept_ids) > 1 else None,
            "password": "user123",
        },
    ]
    
    user_ids = []
    for user in users:
        try:
            response = requests.post(f"{BASE_URL}/users", json=user)
            if response.status_code == 200:
                user_data = response.json()
                user_ids.append(user_data["id"])
                print(f"✓ Usuário criado: {user['email']}")
        except Exception as e:
            print(f"✗ Erro ao criar usuário: {e}")

    # Criar templates
    print("\n3. Criando templates...")
    templates = [
        {
            "name": "Welcome Email",
            "subject": "Bem-vindo ao SafeClicker",
            "body": "<html><body>Bem-vindo!</body></html>",
            "description": "Template de boas-vindas",
        },
        {
            "name": "Security Alert",
            "subject": "Alerta de Segurança",
            "body": "<html><body>Clique aqui para verificar sua conta</body></html>",
            "description": "Template de alerta de segurança",
        },
    ]
    
    template_ids = []
    for template in templates:
        try:
            response = requests.post(f"{BASE_URL}/templates", json=template)
            if response.status_code == 200:
                template_data = response.json()
                template_ids.append(template_data["id"])
                print(f"✓ Template criado: {template['name']}")
        except Exception as e:
            print(f"✗ Erro ao criar template: {e}")

    print("\n✓ Dados de exemplo criados com sucesso!")


if __name__ == "__main__":
    create_sample_data()
