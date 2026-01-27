import psycopg2

conn = psycopg2.connect(
    host='localhost',
    user='postgres',
    password='123456',
    dbname='safeclicker'
)
cur = conn.cursor()

# Deletar usuários com roles inválidas
cur.execute("DELETE FROM users WHERE role::text NOT IN ('TI', 'GESTOR', 'COLABORADOR')")
conn.commit()
print(f'✓ {cur.rowcount} usuário(s) com role inválida removido(s)')

cur.close()
conn.close()
