#!/usr/bin/env python3
"""
Script para adicionar colunas response_time_seconds e points_earned à tabela quiz_responses
"""

import psycopg2
import os

# Conexão direta
DB_URL = "postgresql://postgres:123456@localhost:5432/safeclicker"

try:
    # Conectar ao banco de dados
    connection = psycopg2.connect(DB_URL)
    cursor = connection.cursor()
    
    # Verificar se a coluna response_time_seconds existe
    cursor.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='quiz_responses' AND column_name='response_time_seconds'
    """)
    
    if cursor.fetchone() is None:
        print("Adicionando coluna response_time_seconds a tabela quiz_responses...")
        cursor.execute("""
            ALTER TABLE quiz_responses
            ADD COLUMN response_time_seconds INTEGER DEFAULT 0
        """)
        connection.commit()
        print("Coluna response_time_seconds adicionada com sucesso!")
    else:
        print("Coluna response_time_seconds ja existe!")
    
    # Verificar se a coluna points_earned existe
    cursor.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name='quiz_responses' AND column_name='points_earned'
    """)
    
    if cursor.fetchone() is None:
        print("Adicionando coluna points_earned a tabela quiz_responses...")
        cursor.execute("""
            ALTER TABLE quiz_responses
            ADD COLUMN points_earned INTEGER DEFAULT 0
        """)
        connection.commit()
        print("Coluna points_earned adicionada com sucesso!")
    else:
        print("Coluna points_earned ja existe!")
    
    cursor.close()
    connection.close()
    print("\nTodas as colunas foram verificadas e adicionadas se necessario!")

except Exception as e:
    print(f"Erro: {e}")
    exit(1)
