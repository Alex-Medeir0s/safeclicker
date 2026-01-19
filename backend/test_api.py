#!/usr/bin/env python3
"""
Script de teste para verificar se a API está funcionando corretamente.
"""

import sys
import subprocess
import time
import requests
from pathlib import Path

# Cores para output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

BASE_URL = "http://localhost:8000"


def print_status(message: str, status: str = "info"):
    """Imprimir mensagem com status"""
    colors = {
        "ok": GREEN,
        "error": RED,
        "warning": YELLOW,
        "info": "",
    }
    print(f"{colors.get(status, '')}{message}{RESET}")


def wait_for_api(max_attempts: int = 30, delay: int = 1):
    """Esperar até que a API esteja disponível"""
    print_status("Aguardando API ficar disponível...", "warning")
    
    for attempt in range(max_attempts):
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=2)
            if response.status_code == 200:
                print_status("✓ API está disponível!", "ok")
                return True
        except requests.exceptions.ConnectionError:
            pass
        
        time.sleep(delay)
        print(".", end="", flush=True)
    
    print_status("\n✗ Timeout aguardando API", "error")
    return False


def test_api():
    """Executar testes da API"""
    print_status("\n" + "=" * 50, "info")
    print_status("TESTES DA API SAFECLICKER", "info")
    print_status("=" * 50, "info")
    
    tests_passed = 0
    tests_failed = 0
    
    # Teste 1: Health Check
    print_status("\n[1] Testando Health Check...", "info")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print_status("✓ Health Check OK", "ok")
            tests_passed += 1
        else:
            print_status(f"✗ Unexpected status: {response.status_code}", "error")
            tests_failed += 1
    except Exception as e:
        print_status(f"✗ Erro: {e}", "error")
        tests_failed += 1
    
    # Teste 2: Listar Usuários (vazio)
    print_status("\n[2] Testando GET /users...", "info")
    try:
        response = requests.get(f"{BASE_URL}/users")
        if response.status_code == 200:
            users = response.json()
            print_status(f"✓ Listagem de usuários OK (total: {len(users)})", "ok")
            tests_passed += 1
        else:
            print_status(f"✗ Unexpected status: {response.status_code}", "error")
            tests_failed += 1
    except Exception as e:
        print_status(f"✗ Erro: {e}", "error")
        tests_failed += 1
    
    # Teste 3: Listar Departamentos
    print_status("\n[3] Testando GET /departments...", "info")
    try:
        response = requests.get(f"{BASE_URL}/departments")
        if response.status_code == 200:
            depts = response.json()
            print_status(f"✓ Listagem de departamentos OK (total: {len(depts)})", "ok")
            tests_passed += 1
        else:
            print_status(f"✗ Unexpected status: {response.status_code}", "error")
            tests_failed += 1
    except Exception as e:
        print_status(f"✗ Erro: {e}", "error")
        tests_failed += 1
    
    # Teste 4: Criar Departamento
    print_status("\n[4] Testando POST /departments...", "info")
    try:
        payload = {
            "name": f"Test Dept {time.time()}",
            "description": "Test Department"
        }
        response = requests.post(f"{BASE_URL}/departments", json=payload)
        if response.status_code == 200:
            dept = response.json()
            print_status(f"✓ Departamento criado com ID: {dept.get('id')}", "ok")
            tests_passed += 1
        else:
            print_status(f"✗ Status: {response.status_code}", "error")
            print_status(f"  Resposta: {response.text}", "error")
            tests_failed += 1
    except Exception as e:
        print_status(f"✗ Erro: {e}", "error")
        tests_failed += 1
    
    # Teste 5: Listar Campanhas
    print_status("\n[5] Testando GET /campaigns...", "info")
    try:
        response = requests.get(f"{BASE_URL}/campaigns")
        if response.status_code == 200:
            campaigns = response.json()
            print_status(f"✓ Listagem de campanhas OK (total: {len(campaigns)})", "ok")
            tests_passed += 1
        else:
            print_status(f"✗ Unexpected status: {response.status_code}", "error")
            tests_failed += 1
    except Exception as e:
        print_status(f"✗ Erro: {e}", "error")
        tests_failed += 1
    
    # Teste 6: Listar Templates
    print_status("\n[6] Testando GET /templates...", "info")
    try:
        response = requests.get(f"{BASE_URL}/templates")
        if response.status_code == 200:
            templates = response.json()
            print_status(f"✓ Listagem de templates OK (total: {len(templates)})", "ok")
            tests_passed += 1
        else:
            print_status(f"✗ Unexpected status: {response.status_code}", "error")
            tests_failed += 1
    except Exception as e:
        print_status(f"✗ Erro: {e}", "error")
        tests_failed += 1
    
    # Resumo
    print_status("\n" + "=" * 50, "info")
    print_status(f"RESULTADOS: {tests_passed} ✓ | {tests_failed} ✗", "info")
    print_status("=" * 50, "info")
    
    return tests_failed == 0


def main():
    """Main"""
    # Verificar se a API está rodando
    if not wait_for_api():
        print_status(
            "\nNão conseguiu conectar com a API.\n"
            "Inicie o servidor com: uvicorn app.main:app --reload",
            "error"
        )
        sys.exit(1)
    
    # Rodar testes
    if test_api():
        print_status("\n✓ Todos os testes passaram!", "ok")
        sys.exit(0)
    else:
        print_status("\n✗ Alguns testes falharam", "error")
        sys.exit(1)


if __name__ == "__main__":
    main()
