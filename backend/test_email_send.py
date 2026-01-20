"""
Script para testar o fluxo completo de envio de campanha por email.
Cria departamento, usuários, campanha com template HTML e dispara o envio.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_email_send_flow():
    print("=" * 70)
    print("🚀 TESTE DE ENVIO DE CAMPANHA POR EMAIL")
    print("=" * 70)
    
    # 1. Criar departamento
    print("\n1️⃣ Criando departamento de teste...")
    dept_response = requests.post(
        f"{BASE_URL}/departments/",
        json={"name": "Teste", "description": "Departamento de teste"}
    )
    if dept_response.status_code != 200:
        print(f"❌ Erro ao criar departamento: {dept_response.text}")
        return
    dept_id = dept_response.json()["id"]
    print(f"✅ Departamento criado: ID {dept_id}")
    
    # 2. Criar usuários
    print("\n2️⃣ Criando usuários de teste...")
    users_emails = []
    for i in range(2):
        user_response = requests.post(
            f"{BASE_URL}/users/",
            json={
                "email": f"teste{i+1}@example.com",
                "full_name": f"Usuário Teste {i+1}",
                "password": "teste123",
                "role": "colaborador",
                "department_id": dept_id,
            }
        )
        if user_response.status_code == 200:
            users_emails.append(f"teste{i+1}@example.com")
            print(f"✅ Usuário criado: teste{i+1}@example.com")
        else:
            print(f"⚠️ Erro/Usuário já existe: teste{i+1}@example.com")
            users_emails.append(f"teste{i+1}@example.com")
    
    # 3. Criar template com HTML contendo {{tracking_url}}
    print("\n3️⃣ Criando template de email...")
    html_template = """
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 8px; }
            .content { padding: 20px; background-color: #ecf0f1; margin-top: 10px; border-radius: 8px; }
            .button { display: inline-block; background-color: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .footer { font-size: 12px; color: #7f8c8d; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Alerta de Segurança - SafeClicker</h1>
            </div>
            <div class="content">
                <p>Olá,</p>
                <p>Recebemos uma tentativa de acesso à sua conta. Por favor, verifique e confirme sua identidade clicando no link abaixo:</p>
                <p>
                    <a href="{{tracking_url}}" class="button">✓ Verificar Identidade</a>
                </p>
                <p>Se você não solicitou esta verificação, ignore este email.</p>
            </div>
            <div class="footer">
                <p>SafeClicker - Sistema de Conscientização em Segurança</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    template_response = requests.post(
        f"{BASE_URL}/templates/",
        json={
            "name": "Template de Teste - Alerta de Segurança",
            "subject": "🔒 Verificação de Segurança Necessária",
            "body": html_template,
            "description": "Template de teste para phishing simulado",
        }
    )
    if template_response.status_code != 200:
        print(f"❌ Erro ao criar template: {template_response.text}")
        return
    template_id = template_response.json()["id"]
    print(f"✅ Template criado: ID {template_id}")
    
    # 4. Criar campanha com subject, html_template e target_department_id
    print("\n4️⃣ Criando campanha com template HTML...")
    campaign_response = requests.post(
        f"{BASE_URL}/campaigns/",
        json={
            "name": "Campanha de Teste - Phishing Simulado",
            "description": "Campanha de teste para validar envio de emails",
            "subject": "🔒 Verificação de Segurança Necessária",
            "html_template": html_template,
            "template_id": template_id,
            "target_department_id": dept_id,
            "status": "draft",
            "complexity": "intermediario",
            "trigger": "autoridade",
        }
    )
    if campaign_response.status_code != 200:
        print(f"❌ Erro ao criar campanha: {campaign_response.text}")
        return
    campaign = campaign_response.json()
    campaign_id = campaign["id"]
    print(f"✅ Campanha criada: ID {campaign_id}")
    print(f"   - Nome: {campaign.get('name')}")
    print(f"   - Status: {campaign.get('status')}")
    print(f"   - Departamento alvo: ID {dept_id}")
    
    # 5. Enviar a campanha
    print("\n5️⃣ Disparando envio de campanha por email...")
    send_response = requests.post(
        f"{BASE_URL}/campaigns/{campaign_id}/send"
    )
    if send_response.status_code == 200:
        result = send_response.json()
        print(f"✅ Campanha enviada com sucesso!")
        print(f"   - Total de usuários: {result.get('recipients')}")
        print(f"   - Emails enviados: {result.get('sent')}")
        print(f"   - Erros: {len(result.get('errors', []))}")
        
        if result.get('errors'):
            print("\n⚠️ Erros de envio:")
            for error in result['errors']:
                print(f"   - {error['email']}: {error['error']}")
    else:
        print(f"❌ Erro ao enviar campanha: {send_response.status_code}")
        print(f"   Resposta: {send_response.text}")
        return
    
    print("\n" + "=" * 70)
    print("✅ TESTE CONCLUÍDO COM SUCESSO!")
    print("=" * 70)
    print(f"\n📧 Emails enviados para: {', '.join(users_emails)}")
    print(f"\n💡 Dicas:")
    print(f"   1. Verifique os emails em tempo real (ou Mailtrap/MailHog se configurado)")
    print(f"   2. Clique no link {{{{tracking_url}}}} para validar o rastreamento")
    print(f"   3. Verifique o banco de dados para registros em campaign_sends")
    print(f"\n🔗 Link de rastreamento será gerado e injetado no {{{{tracking_url}}}}")
    print(f"   Format: http://localhost:8000/campaigns/track/{{token}}")

if __name__ == "__main__":
    test_email_send_flow()
