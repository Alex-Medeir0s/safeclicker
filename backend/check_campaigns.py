import sqlite3
conn = sqlite3.connect('test.db')
cursor = conn.cursor()

print('\n📊 CAMPANHAS NO BANCO:')
print('-' * 60)
cursor.execute('SELECT id, name, target_department_id, department_id FROM campaigns ORDER BY id DESC LIMIT 5')
for row in cursor.fetchall():
    print(f'  ID {row[0]}: {row[1]}')
    print(f'    -> Target Department ID: {row[2]}, Department ID: {row[3]}')

print('\n')
conn.close()
