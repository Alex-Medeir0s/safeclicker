# Guia de Início Rápido - SafeClicker

## ✅ O que foi configurado

### Backend (FastAPI + PostgreSQL)
- ✅ Estrutura de pastas completa
- ✅ Modelos SQLAlchemy para todas as tabelas:
  - Users (Usuários)
  - Campaigns (Campanhas)
  - Templates (Templates de Email)
  - Departments (Departamentos)
  - CampaignSends (Envios)
  - ClickEvents (Eventos de Clique)
  - Microtrainings (Microtreinamentos)

- ✅ Schemas Pydantic para validação de dados
- ✅ Rotas API RESTful completas (GET, POST, PUT, DELETE)
- ✅ CORS configurado para comunicação com frontend
- ✅ Banco de dados PostgreSQL conectado

### Frontend (Next.js/React)
- ✅ Serviço de API (`api.ts`) com funções para:
  - Usuários
  - Campanhas
  - Templates
  - Departamentos
  - Health Check

## 🚀 Como Executar

### 1. Banco de Dados PostgreSQL

Certifique-se de que PostgreSQL está instalado e rodando. Crie o banco:

```sql
CREATE DATABASE safeclicker;
```

### 2. Backend - Primeiro Terminal

```bash
cd D:\safeclicker\backend

# Ativar ambiente virtual (já foi feito)
.\venv\Scripts\activate

# Instalar dependências (já foi feito)
# pip install -r requirements.txt

# Rodar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API estará disponível em: `http://localhost:8000`
Documentação Swagger: `http://localhost:8000/docs`

### 3. Frontend - Segundo Terminal

```bash
cd D:\safeclicker\frontend

# Instalar dependências (se não instalado)
npm install

# Rodar servidor de desenvolvimento
npm run dev
```

Frontend estará em: `http://localhost:3000`

## 📋 Endpoints Disponíveis

### Health Check
```
GET /health
```

### Usuários
```
GET    /users                 # Listar todos
GET    /users/{id}            # Obter por ID
POST   /users                 # Criar novo
PUT    /users/{id}            # Atualizar
DELETE /users/{id}            # Deletar
```

### Campanhas
```
GET    /campaigns             # Listar todos
GET    /campaigns/{id}        # Obter por ID
POST   /campaigns             # Criar nova
PUT    /campaigns/{id}        # Atualizar
DELETE /campaigns/{id}        # Deletar
```

### Templates
```
GET    /templates             # Listar todos
GET    /templates/{id}        # Obter por ID
POST   /templates             # Criar novo
DELETE /templates/{id}        # Deletar
```

### Departamentos
```
GET    /departments           # Listar todos
GET    /departments/{id}      # Obter por ID
POST   /departments           # Criar novo
DELETE /departments/{id}      # Deletar
```

## 💻 Como Usar no Frontend

```typescript
import { 
  usersAPI, 
  campaignsAPI, 
  templatesAPI, 
  departmentsAPI 
} from '@/services/api';

// Exemplo 1: Buscar todos os usuários
const response = await usersAPI.getAll();
console.log(response.data);

// Exemplo 2: Criar uma campanha
const newCampaign = await campaignsAPI.create({
  name: 'Q1 2026 Campaign',
  description: 'Campanha de segurança Q1',
  template_id: 1,
  status: 'draft',
  target_audience: 'TI Department'
});

// Exemplo 3: Buscar template específico
const template = await templatesAPI.getById(1);

// Exemplo 4: Listar departamentos
const departments = await departmentsAPI.getAll();
```

## 🗄️ Estrutura do Banco de Dados

```
users (id, email, full_name, hashed_password, department_id, created_at, updated_at)
│
├─── departments (id, name, description, created_at, updated_at)
│
├─── campaigns (id, name, description, template_id, created_by, status, created_at, updated_at)
│    │
│    └─── campaign_sends (id, campaign_id, recipient_email, sent_at, opened, clicked)
│         │
│         └─── click_events (id, campaign_send_id, link_url, clicked_at)
│
├─── templates (id, name, subject, body, created_at, updated_at)
│
└─── microtrainings (id, title, content, duration_minutes, created_at, updated_at)
```

## 📦 Dependências Instaladas

### Backend (Python)
- FastAPI - Framework web
- Uvicorn - Servidor ASGI
- SQLAlchemy - ORM
- Pydantic - Validação
- psycopg2 - Driver PostgreSQL
- python-dotenv - Variáveis de ambiente

### Frontend (Node.js)
- Next.js - Framework React
- Axios - Cliente HTTP
- Typescript - Type safety

## ⚠️ Importante

1. **Arquivo .env**: Atualize com suas credenciais PostgreSQL
```
DATABASE_URL=postgresql://seu_usuario:sua_senha@localhost:5432/safeclicker
SECRET_KEY=sua-chave-secreta
DEBUG=True
```

2. **CORS**: Configurado para `localhost:3000` - ajuste se necessário em `app/main.py`

3. **Autenticação**: Implementar autenticação JWT (próximo passo)

4. **Validação**: Todos os dados são validados com Pydantic

## 🔧 Próximos Passos

1. Implementar autenticação JWT
2. Adicionar middleware de autenticação
3. Criar testes unitários
4. Implementar logging
5. Adicionar paginação avançada
6. Implementar filtros e busca

## 📝 Exemplo de Request com cURL

```bash
# Health Check
curl http://localhost:8000/health

# Listar usuários
curl http://localhost:8000/users

# Criar departamento
curl -X POST http://localhost:8000/departments \
  -H "Content-Type: application/json" \
  -d '{"name":"RH","description":"Recursos Humanos"}'
```

## 🆘 Troubleshooting

**Erro: "postgresql: connection refused"**
- Certifique-se que PostgreSQL está rodando
- Verifique credenciais no .env

**Erro: "Module not found"**
- Execute `pip install -r requirements.txt` no backend
- Execute `npm install` no frontend

**CORS error**
- Certifique-se que o frontend está rodando em `localhost:3000`
- Verifique configuração de CORS em `app/main.py`

**Tabelas não foram criadas**
- As tabelas são criadas automaticamente ao iniciar o servidor
- Verifique se o banco de dados foi criado

---

✅ **Backend e Frontend configurados e prontos para desenvolvimento!**
