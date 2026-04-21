# SafeClicker 🛡️

Plataforma Web de Simulação e Treinamento Contínuo contra Phishing.

## 📋 Sobre o Projeto

SafeClicker é uma plataforma completa para criar, gerenciar e monitorar campanhas educativas de simulação de phishing. O sistema permite que organizações treinem seus colaboradores sobre segurança da informação através de campanhas controladas e microtreinamentos personalizados.

### Funcionalidades Principais

- 📧 **Gerenciamento de Campanhas**: Crie e gerencie campanhas de phishing simulado
- 👥 **Gestão de Usuários**: Controle de usuários e departamentos
- 📊 **Métricas e Relatórios**: Acompanhe cliques, taxas de sucesso e evolução
- 🎓 **Microtreinamentos**: Conteúdo educativo personalizado
- 📝 **Templates de Email**: Biblioteca de templates configuráveis
- 🔍 **Rastreamento de Eventos**: Monitoramento detalhado de interações

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.12+**
- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy** - ORM para gerenciamento de banco de dados
- **PostgreSQL** - Banco de dados relacional
- **Pydantic** - Validação de dados
- **Uvicorn** - Servidor ASGI

### Frontend
- **Next.js 16** - Framework React
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS
- **Axios** - Cliente HTTP

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Python 3.12+** ([Download](https://www.python.org/downloads/))
- **Node.js 20+** e **npm** ([Download](https://nodejs.org/))
- **PostgreSQL 14+** ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

## 🚀 Como Executar

### 1️⃣ Configurar o Banco de Dados

Inicie o PostgreSQL e crie o banco de dados:

```sql
CREATE DATABASE safeclicker;
```

Ou via linha de comando:

```bash
psql -U postgres
CREATE DATABASE safeclicker;
\q
```

### 2️⃣ Configurar e Executar o Backend

#### Passo 1: Navegar até a pasta do backend

```bash
cd backend
```

#### Passo 2: Criar e ativar o ambiente virtual Python

**Windows:**
```bash
python -m venv venv
.\venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Passo 3: Instalar dependências

```bash
pip install -r requirements.txt
```

#### Passo 4: Configurar variáveis de ambiente (opcional)

Crie um arquivo `.env` na pasta `backend` com as configurações:

```env
# Banco de Dados
DATABASE_URL=postgresql://postgres:password@localhost:5432/safeclicker

# Segurança
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# URLs
APP_BASE_URL=http://SEU_IP_LOCAL:8000
FRONTEND_URL=http://SEU_IP_LOCAL:3000

# SendGrid (opcional - para envio de emails)
SENDGRID_API_KEY=SG_SUA_API_KEY_AQUI
SENDGRID_FROM_EMAIL=campanhas@safeclicker.local
```

> **Nota:** As configurações padrão já estão definidas em `backend/app/core/config.py`. O arquivo `.env` é opcional se você usar os valores padrão.

#### Passo 5: Inicializar o banco de dados

```bash
# Criar as tabelas no banco de dados
python sync_database.py

# (Opcional) Adicionar dados de exemplo
python init_data.py
```

#### Passo 6: Executar o servidor backend

**Opção 1: Usando o script de inicialização (Recomendado)**

```bash
# Windows - Execute o arquivo
.\start_server.bat

# Ou use PowerShell
.\start_server.ps1
```

**Opção 2: Comando manual com PYTHONPATH**

```bash
# Windows (PowerShell)
$env:PYTHONPATH="d:\safeclicker\backend"; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Windows (Command Prompt)
set PYTHONPATH=d:\safeclicker\backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Linux/Mac
export PYTHONPATH=/path/to/backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **⚠️ Importante:** Sempre execute o comando no diretório `backend/`. O PYTHONPATH deve apontar para a pasta do backend para que o módulo `app` seja encontrado.

O backend estará disponível em:

- Local: **http://localhost:8000**
- Rede local: **http://SEU_IP_LOCAL:8000**

- API Docs (Swagger): http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### 3️⃣ Configurar e Executar o Frontend

**Abra um novo terminal** e execute:

#### Passo 1: Navegar até a pasta do frontend

```bash
cd frontend
```

#### Passo 2: Instalar dependências

```bash
npm install
```

#### Passo 2.1: Configurar URL da API no frontend (recomendado para rede local)

Crie `frontend/.env.local` com:

```env
NEXT_PUBLIC_API_URL=http://SEU_IP_LOCAL:8000
```

#### Passo 3: Executar o servidor de desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em:

- Local: **http://localhost:3000**
- Rede local: **http://SEU_IP_LOCAL:3000**

### Acesso pela rede local (outra máquina)

1. Descubra o IP local da máquina onde o projeto está rodando (ex.: `ipconfig` no Windows).
2. Inicie backend e frontend na máquina host.
3. Na máquina cliente, acesse `http://SEU_IP_LOCAL:3000`.
4. Para os links de e-mail/redirecionamentos funcionarem corretamente, configure no backend:

```env
APP_BASE_URL=http://SEU_IP_LOCAL:8000
FRONTEND_URL=http://SEU_IP_LOCAL:3000
```

## 📁 Estrutura do Projeto

```
safeclicker/
├── backend/                    # Servidor FastAPI
│   ├── app/
│   │   ├── core/              # Configurações e database
│   │   │   ├── config.py      # Configurações do projeto
│   │   │   └── database.py    # Conexão com PostgreSQL
│   │   ├── models/            # Modelos SQLAlchemy (tabelas)
│   │   ├── routes/            # Endpoints da API
│   │   ├── schemas/           # Schemas Pydantic (validação)
│   │   └── services/          # Lógica de negócio
│   ├── requirements.txt       # Dependências Python
│   └── sync_database.py       # Script para criar tabelas
│
├── frontend/                   # Aplicação Next.js
│   ├── src/
│   │   ├── app/               # Páginas e rotas (App Router)
│   │   ├── components/        # Componentes React
│   │   ├── services/          # Cliente API (Axios)
│   │   └── styles/            # Estilos globais
│   ├── package.json           # Dependências Node.js
│   └── next.config.ts         # Configuração Next.js
│
└── README.md                   # Este arquivo
```

## 🔧 Scripts Úteis

### Backend

```bash
# Iniciar o servidor (recomendado - configura PYTHONPATH automaticamente)
cd backend
.\start_server.bat      # Windows
# ou
.\start_server.ps1      # PowerShell

# Sincronizar estrutura do banco de dados
python sync_database.py

# Criar dados de teste
python init_data.py

# Criar usuário de teste
python create_test_user.py

# Executar testes da API
python test_api.py

# Rodar servidor com reload automático (manual)
python -m uvicorn app.main:app --reload

# Rodar servidor em outra porta
python -m uvicorn app.main:app --reload --port 8001
```

### Frontend

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar build de produção
npm run start

# Lint do código
npm run lint
```

## 🧪 Testando a API

Após iniciar o backend, você pode testar a API de várias formas:

### 1. Swagger UI (Recomendado)
Acesse http://localhost:8000/docs para uma interface interativa completa.

### 2. Arquivo de teste
```bash
cd backend
python test_api.py
```

### 3. cURL
```bash
# Health Check
curl http://localhost:8000/health

# Listar usuários
curl http://localhost:8000/users

# Listar campanhas
curl http://localhost:8000/campaigns
```

## 👤 Usuário de Teste

Após executar `python init_data.py`, você terá acesso a:

- **Email:** admin@empresa.com
- **Senha:** admin123
- **Role:** admin

## 🗃️ Modelos de Dados

O sistema possui os seguintes modelos principais:

- **User** - Usuários do sistema
- **Department** - Departamentos da organização
- **Campaign** - Campanhas de phishing
- **Template** - Templates de emails
- **CampaignSend** - Envios individuais de campanhas
- **ClickEvent** - Eventos de clique nos links
- **Microtraining** - Conteúdos de treinamento

## 🔐 Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação. O token deve ser incluído no header das requisições:

```
Authorization: Bearer <seu-token-jwt>
```

## 📊 Endpoints Principais da API

- `GET /health` - Status do sistema
- `GET /users` - Listar usuários
- `POST /users` - Criar usuário
- `GET /campaigns` - Listar campanhas
- `POST /campaigns` - Criar campanha
- `GET /templates` - Listar templates
- `GET /departments` - Listar departamentos
- `GET /metrics` - Métricas do sistema

Documentação completa em: http://localhost:8000/docs

## 🐛 Solução de Problemas

### Erro "ModuleNotFoundError: No module named 'app'"

Este erro ocorre quando o `PYTHONPATH` não está configurado corretamente, especialmente após reiniciar o computador.

**Solução:**

1. **Use o script de inicialização (Recomendado)**
   ```bash
   cd backend
   .\start_server.bat      # Windows
   # ou
   .\start_server.ps1      # PowerShell
   ```

2. **Ou defina o PYTHONPATH manualmente antes de rodar o servidor**
   ```bash
   # Windows (PowerShell)
   $env:PYTHONPATH="d:\safeclicker\backend"; python -m uvicorn app.main:app --reload
   
   # Windows (Command Prompt)
   set PYTHONPATH=d:\safeclicker\backend && python -m uvicorn app.main:app --reload
   ```

> **Dica:** Este é o erro mais comum após reiniciar o PC porque o PYTHONPATH não persiste entre reinicializações. Os scripts `start_server.bat` e `start_server.ps1` resolvem isso automaticamente.

### Erro de conexão com o banco de dados

Verifique se:
1. O PostgreSQL está rodando
2. O banco de dados `safeclicker` foi criado
3. As credenciais em `config.py` ou `.env` estão corretas

```bash
# Verificar status do PostgreSQL (Windows)
pg_ctl status

# Verificar status do PostgreSQL (Linux)
sudo systemctl status postgresql
```

### Erro "Port already in use"

Algum serviço já está usando a porta 8000 ou 3000:

```bash
# Backend em outra porta
python -m uvicorn app.main:app --reload --port 8001

# Frontend em outra porta
npm run dev -- -p 3001
```

### Módulos Python não encontrados

Certifique-se de que o ambiente virtual está ativado:

```bash
# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Reinstalar dependências
pip install -r requirements.txt
```

## 📚 Documentação Adicional

- [QUICK_START.md](QUICK_START.md) - Guia de início rápido
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura do sistema
- [DEPLOYMENT.md](DEPLOYMENT.md) - Guia de deploy
- [STATUS.md](STATUS.md) - Status atual do projeto

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é privado e de uso interno.

## 👨‍💻 Suporte

Para dúvidas e suporte, consulte a documentação completa na pasta do projeto ou entre em contato com a equipe de desenvolvimento.

---

**SafeClicker** - Protegendo organizações através da educação 🛡️
