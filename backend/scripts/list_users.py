import sqlite3
import os

db='test.db'
if not os.path.exists(db):
    print('NO_DB')
else:
    conn=sqlite3.connect(db)
    cur=conn.cursor()
    try:
        cur.execute('SELECT id,email,full_name,hashed_password,role,is_active FROM users')
        rows=cur.fetchall()
        if not rows:
            print('NO_USERS')
        for r in rows:
            print(r)
    except Exception as e:
        print('ERR',e)
    conn.close()
