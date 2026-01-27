#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para atualizar roles antigos (admin, usuario) para os novos valores do enum UserRole.
Converte 'admin' -> 'TI' e 'usuario' -> 'COLABORADOR'
"""

import sqlite3
import sys
from pathlib import Path

# Caminho do banco de dados
DB_PATH = Path(__file__).parent / 'test.db'

def update_roles():
    """Atualiza os roles dos usuários para os valores do novo enum."""
    
    if not DB_PATH.exists():
        print(f"❌ Banco de dados não encontrado: {DB_PATH}")
        sys.exit(1)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Verificar roles existentes
        cursor.execute("SELECT DISTINCT role FROM users")
        roles = [row[0] for row in cursor.fetchall()]
        print(f"📋 Roles atuais no banco: {roles}")
        
        updates_made = False
        
        # Converter 'admin' para 'TI'
        if 'admin' in roles:
            cursor.execute("UPDATE users SET role = 'TI' WHERE role = 'admin'")
            affected = cursor.rowcount
            print(f"✓ Converteu {affected} usuário(s) de 'admin' para 'TI'")
            updates_made = True
        
        # Converter 'usuario' para 'COLABORADOR'
        if 'usuario' in roles:
            cursor.execute("UPDATE users SET role = 'COLABORADOR' WHERE role = 'usuario'")
            affected = cursor.rowcount
            print(f"✓ Converteu {affected} usuário(s) de 'usuario' para 'COLABORADOR'")
            updates_made = True
        
        # Converter qualquer outro valor desconhecido para 'COLABORADOR'
        valid_roles = ['TI', 'GESTOR', 'COLABORADOR']
        invalid_roles = [r for r in roles if r not in valid_roles]
        
        if invalid_roles:
            placeholders = ','.join('?' * len(invalid_roles))
            cursor.execute(
                f"UPDATE users SET role = 'COLABORADOR' WHERE role NOT IN ({placeholders})",
                valid_roles
            )
            affected = cursor.rowcount
            print(f"✓ Converteu {affected} usuário(s) com roles inválidos para 'COLABORADOR'")
            updates_made = True
        
        if updates_made:
            conn.commit()
            print("\n✅ Todos os roles foram atualizados com sucesso!")
            
            # Mostrar distribuição final
            cursor.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
            print("\n📊 Distribuição final de usuários por role:")
            for role, count in cursor.fetchall():
                print(f"   - {role}: {count} usuário(s)")
        else:
            print("\n✅ Nenhuma atualização necessária - todos os roles já estão corretos!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Erro ao atualizar roles: {e}")
        sys.exit(1)
    
    finally:
        conn.close()

if __name__ == '__main__':
    print("🔄 Atualizando roles de usuários para o novo enum UserRole...\n")
    update_roles()
