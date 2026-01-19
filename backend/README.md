# SafeClicker API

API Backend para o sistema de simulação de phishing e treinamento de segurança.

## Setup Inicial

### Backend

1. **Instalar dependências:**
```bash
cd backend
venv\Scripts\activate  # No Windows
pip install -r requirements.txt
```

2. **Configurar variáveis de ambiente (.env):**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/safeclicker
SECRET_KEY=your-secret-key-here
DEBUG=True
```

3. **Criar banco de dados PostgreSQL:**
```sql
CREATE DATABASE safeclicker;
```

4. **Criar as tabelas (automático ao iniciar a app):**
As tabelas serão criadas automaticamente quando você iniciar o servidor.

5. **Executar o servidor:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

A API estará disponível em: `http://localhost:8000`

### Frontend

1. **Instalar dependências:**
```bash
cd frontend
npm install
```

2. **Executar o frontend:**
```bash
npm run dev
```

O frontend estará disponível em: `http://localhost:3000`

## Endpoints Disponíveis

### Health Check
- `GET /health` - Verificar status da API

### Usuários
- `GET /users` - Listar usuários
- `GET /users/{id}` - Obter usuário por ID
- `POST /users` - Criar novo usuário
- `PUT /users/{id}` - Atualizar usuário
- `DELETE /users/{id}` - Deletar usuário

### Campanhas
- `GET /campaigns` - Listar campanhas
- `GET /campaigns/{id}` - Obter campanha por ID
- `POST /campaigns` - Criar nova campanha
- `PUT /campaigns/{id}` - Atualizar campanha
- `DELETE /campaigns/{id}` - Deletar campanha

### Templates
- `GET /templates` - Listar templates
- `GET /templates/{id}` - Obter template por ID
- `POST /templates` - Criar novo template
- `DELETE /templates/{id}` - Deletar template

### Departamentos
- `GET /departments` - Listar departamentos
- `GET /departments/{id}` - Obter departamento por ID
- `POST /departments` - Criar novo departamento
- `DELETE /departments/{id}` - Deletar departamento

## Estrutura do Projeto

```
backend/
├── app/
│   ├── core/          # Configurações e banco de dados
│   ├── models/        # Modelos SQLAlchemy
│   ├── schemas/       # Schemas Pydantic para validação
│   ├── routes/        # Rotas da API
│   └── main.py        # App principal FastAPI
├── venv/              # Ambiente virtual Python
├── requirements.txt   # Dependências
└── .env              # Variáveis de ambiente

frontend/
├── src/
│   ├── app/          # Layout da aplicação
│   ├── components/   # Componentes React
│   ├── services/     # Serviços (API calls)
│   └── styles/       # Estilos CSS
└── package.json      # Dependências Node.js
```

## Banco de Dados

### Tabelas

1. **users** - Usuários da plataforma
2. **departments** - Departamentos
3. **campaigns** - Campanhas de phishing
4. **templates** - Templates de email
5. **campaign_sends** - Envios de campanhas
6. **click_events** - Eventos de clique em links
7. **microtrainings** - Microtreinamentos

## Como usar no Frontend

```typescript
import { usersAPI, campaignsAPI, templatesAPI, departmentsAPI } from '@/services/api';

// Buscar usuários
const users = await usersAPI.getAll();

// Criar campanha
const campaign = await campaignsAPI.create({ name: 'Q1 Campaign', ... });

// Buscar templates
const templates = await templatesAPI.getAll();
```
