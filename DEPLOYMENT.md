# Deployment & Troubleshooting Guide

## 🚀 Deployment

### Local Development

```bash
# Terminal 1 - Backend
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production Deployment

#### Backend (Production)

```bash
# 1. Build
pip install -r requirements.txt

# 2. Create .env file with production settings
# DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/safeclicker
# SECRET_KEY=<random-secret-key>
# DEBUG=False

# 3. Run with Gunicorn (recommended)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app

# Or with Uvicorn workers
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000
```

#### Frontend (Production)

```bash
# 1. Build
npm run build

# 2. Start
npm run start

# Or deploy to Vercel
# vercel deploy
```

## 🐳 Docker Deployment

### Backend Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: safeclicker
      POSTGRES_PASSWORD: securepass
      POSTGRES_DB: safeclicker
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://safeclicker:securepass@db:5432/safeclicker
      DEBUG: "False"
    depends_on:
      - db
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app

volumes:
  postgres_data:
```

## 🔧 Troubleshooting

### Backend Issues

#### 1. "No module named 'app'"

```bash
# Solução: Executar do diretório correto
cd backend
python -m uvicorn app.main:app --reload
```

#### 2. "Connection refused (postgresql)"

```
Causas possíveis:
- PostgreSQL não está rodando
- Credenciais incorretas
- Banco de dados não existe

Soluções:
1. Verificar se PostgreSQL está rodando
   psql -U postgres -h localhost

2. Verificar .env
   DATABASE_URL=postgresql://user:pass@host:5432/database

3. Criar banco de dados
   CREATE DATABASE safeclicker;
```

#### 3. "CORS error" no frontend

```
Erro: "Access to XMLHttpRequest blocked by CORS policy"

Solução em app/main.py:

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Seu frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 4. Tabelas não foram criadas

```python
# Verificar se tabelas foram criadas
# Conectar ao banco e executar:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

# Se vazio, as tabelas serão criadas automaticamente 
# quando o app inicia (Base.metadata.create_all)

# Ou criar manualmente:
# cd backend && python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

#### 5. "ModuleNotFoundError"

```bash
# Garantir que o venv está ativado
.\venv\Scripts\activate

# Reinstalar dependências
pip install -r requirements.txt

# Verificar instalação
pip list | grep fastapi
```

### Frontend Issues

#### 1. "Cannot find module '@/services/api'"

```
Solução: Verificar se tsconfig.json tem o path alias correto

{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 2. "API call returns 404"

```
Verificar:
1. Backend está rodando em localhost:8000?
   curl http://localhost:8000/health

2. URL base do Axios está correta?
   baseURL: "http://localhost:8000/api"

3. Rota existe no backend?
   GET /users ✓
   GET /campaigns ✓
```

#### 3. "Cannot GET /api/health"

```
Problema: Axios está adicionando /api ao endpoint

Solução em api.ts:
- Remova /api do baseURL se as rotas já incluem
- Ou adicione /api em app/main.py se necessário

Atualmente:
- Axios baseURL: "http://localhost:8000/api"
- Rotas FastAPI: /users, /campaigns, /templates, /departments
- Resultado: GET http://localhost:8000/api/users ✗

Deveria ser:
- Axios baseURL: "http://localhost:8000"
- Resultado: GET http://localhost:8000/users ✓
```

#### 4. npm dependency conflicts

```bash
# Limpar cache e reinstalar
rm -r node_modules package-lock.json
npm install

# Ou forçar resolution
npm install --legacy-peer-deps
```

### Database Issues

#### 1. Cannot connect to PostgreSQL

```bash
# Testar conexão
psql -U postgres -h localhost -d safeclicker

# Se não funcionar, verificar:
1. PostgreSQL está instalado?
   psql --version

2. Serviço está rodando?
   sudo service postgresql status  # Linux
   # ou PostgreSQL app no Windows

3. Criar usuário e banco se necessário
   psql -U postgres
   CREATE USER safeclicker WITH PASSWORD 'password';
   CREATE DATABASE safeclicker OWNER safeclicker;
   GRANT ALL PRIVILEGES ON DATABASE safeclicker TO safeclicker;
```

#### 2. "Permission denied" ao PostgreSQL

```sql
-- Conectar como super user
psql -U postgres

-- Dar permissões corretas
GRANT ALL PRIVILEGES ON DATABASE safeclicker TO safeclicker;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO safeclicker;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO safeclicker;
```

### Performance Issues

#### 1. API respondendo lento

```python
# Verificar query log em app/core/database.py
engine = create_engine(
    settings.database_url,
    echo=True,  # Mostra todas as queries SQL
)

# Otimizações:
1. Adicionar índices no banco
   CREATE INDEX idx_user_email ON users(email);

2. Usar paginação
   GET /users?skip=0&limit=50

3. Caching
   from functools import lru_cache
```

#### 2. Frontend renderizando lentamente

```typescript
// Verificar com React DevTools
// Implementar:
1. Code splitting
   const DynamicComponent = dynamic(() => import('./Component'));

2. Image optimization
   import Image from 'next/image';

3. Memoization
   export const Component = memo(({ data }) => {});
```

## 📊 Monitoring

### Backend Logs

```bash
# Com debug ativado
DEBUG=True uvicorn app.main:app --reload

# Salvar logs em arquivo
uvicorn app.main:app --log-config logging.conf > logs/app.log 2>&1
```

### Database Monitoring

```sql
-- Ver conexões ativas
SELECT datname, usename, state FROM pg_stat_activity;

-- Ver queries lentas
SELECT query, calls, total_time FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;

-- Size do banco
SELECT 
    datname,
    pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database;
```

## ✅ Pre-deployment Checklist

### Backend
- [ ] requirements.txt atualizado
- [ ] .env configurado com valores de produção
- [ ] DEBUG=False
- [ ] CORS configurado para domínio correto
- [ ] Senha hashing implementado
- [ ] Banco de dados criado
- [ ] Migrations testadas
- [ ] Erros 500 tratados com logging

### Frontend
- [ ] API URL configurada corretamente
- [ ] Build otimizado (`npm run build`)
- [ ] Sem console errors
- [ ] Responsivo em mobile
- [ ] Performance testada

### Segurança
- [ ] HTTPS habilitado
- [ ] CORS não está muito permissivo
- [ ] Validação de entrada (Pydantic)
- [ ] SQL Injection prevenido (SQLAlchemy)
- [ ] CSRF tokens (se necessário)
- [ ] Rate limiting implementado
- [ ] Logs de segurança

## 🔄 CI/CD Pipeline Example (GitHub Actions)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: 3.12
      - run: pip install -r backend/requirements.txt
      - run: cd backend && python test_api.py

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 20
      - run: cd frontend && npm install
      - run: cd frontend && npm run build

  deploy:
    needs: [backend-tests, frontend-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          # Deploy commands here
```

---

Para mais informações, consulte:
- FastAPI Docs: https://fastapi.tiangolo.com/
- Next.js Docs: https://nextjs.org/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- SQLAlchemy Docs: https://docs.sqlalchemy.org/
