import requests

resp = requests.get('http://127.0.0.1:8000/departments/')
print('API /departments/ Response:')
print(f'Status: {resp.status_code}')
if resp.status_code == 200:
    data = resp.json()
    print(f'Departamentos retornados: {len(data)}')
    for d in data:
        print(f'  - ID {d["id"]}: {d["name"]}')
else:
    print(resp.text)
