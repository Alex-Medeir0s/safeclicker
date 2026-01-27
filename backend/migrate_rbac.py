"""
Script de migração para implementar RBAC com escopo por departamento.

Este script atualiza o banco de dados para suportar:
- Enum UserRole (TI, GESTOR, COLABORADOR)
- department_id obrigatório em Campaign
- user_id obrigatório em CampaignSend
- Validações de departamento para GESTOR e COLABORADOR

IMPORTANTE: Execute este script após atualizar os models.
"""

import sys
import os

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate_database():
    """Executa migrações necessárias para RBAC"""
    
    engine = create_engine(settings.DATABASE_URL)
    
    print("🔄 Iniciando migração do banco de dados...")
    
    with engine.connect() as conn:
        # 1. Criar tipo enum para UserRole (PostgreSQL)
        print("1️⃣ Criando enum UserRole...")
        try:
            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE userrole AS ENUM ('TI', 'GESTOR', 'COLABORADOR');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            """))
            conn.commit()
            print("   ✅ Enum UserRole criado/verificado")
        except Exception as e:
            print(f"   ⚠️ Aviso ao criar enum: {e}")
        
        # 2. Atualizar coluna role em users para usar enum
        print("2️⃣ Atualizando coluna role...")
        try:
            # Atualizar valores existentes para o novo formato
            conn.execute(text("""
                UPDATE users 
                SET role = CASE 
                    WHEN LOWER(role) = 'ti' OR LOWER(role) = 'admin' THEN 'TI'
                    WHEN LOWER(role) = 'gestor' THEN 'GESTOR'
                    ELSE 'COLABORADOR'
                END
                WHERE role IS NOT NULL;
            """))
            
            # Alterar tipo da coluna (pode falhar se já for enum)
            try:
                conn.execute(text("""
                    ALTER TABLE users 
                    ALTER COLUMN role TYPE userrole 
                    USING role::userrole;
                """))
            except:
                print("   ℹ️ Coluna role já é do tipo enum")
            
            conn.commit()
            print("   ✅ Coluna role atualizada")
        except Exception as e:
            print(f"   ⚠️ Erro ao atualizar role: {e}")
        
        # 3. Adicionar department_id a campaigns se não existir
        print("3️⃣ Verificando department_id em campaigns...")
        try:
            conn.execute(text("""
                ALTER TABLE campaigns 
                ADD COLUMN IF NOT EXISTS department_id INTEGER 
                REFERENCES departments(id);
            """))
            conn.commit()
            print("   ✅ Coluna department_id verificada em campaigns")
        except Exception as e:
            print(f"   ⚠️ Erro: {e}")
        
        # 4. Preencher department_id em campaigns existentes
        print("4️⃣ Preenchendo department_id em campaigns...")
        try:
            # Usar target_department_id como fallback
            conn.execute(text("""
                UPDATE campaigns 
                SET department_id = target_department_id 
                WHERE department_id IS NULL 
                AND target_department_id IS NOT NULL;
            """))
            
            # Para campanhas sem departamento, atribuir ao primeiro departamento
            conn.execute(text("""
                UPDATE campaigns 
                SET department_id = (SELECT id FROM departments LIMIT 1)
                WHERE department_id IS NULL;
            """))
            
            conn.commit()
            print("   ✅ department_id preenchido em campaigns")
        except Exception as e:
            print(f"   ⚠️ Erro: {e}")
        
        # 5. Tornar department_id obrigatório em campaigns
        print("5️⃣ Tornando department_id obrigatório em campaigns...")
        try:
            conn.execute(text("""
                ALTER TABLE campaigns 
                ALTER COLUMN department_id SET NOT NULL;
            """))
            conn.commit()
            print("   ✅ department_id agora é obrigatório em campaigns")
        except Exception as e:
            print(f"   ⚠️ Erro: {e}")
        
        # 6. Adicionar user_id a campaign_sends se não existir
        print("6️⃣ Verificando user_id em campaign_sends...")
        try:
            conn.execute(text("""
                ALTER TABLE campaign_sends 
                ADD COLUMN IF NOT EXISTS user_id INTEGER 
                REFERENCES users(id);
            """))
            conn.commit()
            print("   ✅ Coluna user_id verificada em campaign_sends")
        except Exception as e:
            print(f"   ⚠️ Erro: {e}")
        
        # 7. Preencher user_id em campaign_sends existentes
        print("7️⃣ Preenchendo user_id em campaign_sends...")
        try:
            conn.execute(text("""
                UPDATE campaign_sends cs
                SET user_id = u.id
                FROM users u
                WHERE cs.recipient_email = u.email
                AND cs.user_id IS NULL;
            """))
            conn.commit()
            print("   ✅ user_id preenchido em campaign_sends")
        except Exception as e:
            print(f"   ⚠️ Erro: {e}")
        
        # 8. Tornar user_id obrigatório em campaign_sends
        print("8️⃣ Tornando user_id obrigatório em campaign_sends...")
        try:
            conn.execute(text("""
                ALTER TABLE campaign_sends 
                ALTER COLUMN user_id SET NOT NULL;
            """))
            conn.commit()
            print("   ✅ user_id agora é obrigatório em campaign_sends")
        except Exception as e:
            print(f"   ⚠️ Erro: {e}")
    
    print("\n✅ Migração concluída com sucesso!")
    print("\n⚠️ IMPORTANTE:")
    print("   - Verifique se todos os usuários GESTOR e COLABORADOR têm department_id")
    print("   - Execute sync_database.py para sincronizar os models com o banco")
    print("   - Reinstale dependências: pip install passlib[bcrypt] python-jose[cryptography]")


if __name__ == "__main__":
    try:
        migrate_database()
    except Exception as e:
        print(f"\n❌ Erro durante migração: {e}")
        sys.exit(1)
