# Implementação de RBAC com Escopo por Departamento - SafeClicker

## 📋 Visão Geral

Este documento descreve a implementação completa do sistema RBAC (Role-Based Access Control) com escopo por departamento no projeto SafeClicker.

## 🎯 Objetivos Alcançados

✅ Controle de acesso baseado em roles (TI, GESTOR, COLABORADOR)
✅ Segregação de dados por departamento
✅ Autenticação JWT com informações de role e departamento
✅ Validações de departamento obrigatório
✅ Dashboards personalizados por perfil
✅ Conformidade com LGPD e boas práticas de segurança

## 🔐 Roles Implementadas

### 1. TI
- **Acesso**: Total, sem restrições de departamento
- **Permissões**:
  - Visualizar todos os usuários, campanhas e métricas
  - Criar campanhas para qualquer departamento
  - Gerenciar todos os recursos do sistema
- **Dashboard**: Visão completa com estatísticas de todos os departamentos

### 2. GESTOR
- **Acesso**: Limitado ao próprio departamento
- **Permissões**:
  - Visualizar usuários do seu departamento
  - Visualizar campanhas do seu departamento
  - Criar campanhas apenas para seu departamento
  - Ver métricas e relatórios do departamento
- **Dashboard**: Visão focada no desempenho do departamento
- **Restrição**: `department_id` é obrigatório

### 3. COLABORADOR
- **Acesso**: Apenas aos próprios dados
- **Permissões**:
  - Visualizar apenas suas informações pessoais
  - Ver campanhas recebidas
  - Acompanhar seu próprio desempenho
- **Dashboard**: Painel pessoal de segurança e treinamento
- **Restrição**: `department_id` é obrigatório

## 🏗️ Arquitetura Implementada

### Backend (FastAPI)

#### 1. Models Atualizados

**User** (`backend/app/models/user.py`)
```python
- role: Enum(TI, GESTOR, COLABORADOR)
- department_id: Nullable (obrigatório para GESTOR e COLABORADOR)
- Validações automáticas de departamento
```

**Campaign** (`backend/app/models/campaign.py`)
```python
- department_id: Obrigatório (NOT NULL)
- Relacionamento com Department
```

**CampaignSend** (`backend/app/models/campaign_send.py`)
```python
- user_id: Obrigatório (NOT NULL)
- Relacionamento com User
```

#### 2. Controle de Acesso

**Módulo de Segurança** (`backend/app/core/security.py`)
- Geração e validação de tokens JWT
- Hash de senhas com bcrypt
- Dependências de autenticação (`get_current_user`)
- Decorator para restrição por role (`require_role`)

**Módulo de Access Control** (`backend/app/core/access_control.py`)
- Função `apply_scope(query, model, user)`: Aplica filtros automáticos
- Função `check_resource_access(resource, user)`: Valida acesso a recursos
- Regras centralizadas e reutilizáveis

#### 3. Autenticação JWT

**Token inclui**:
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "role": "GESTOR",
  "department_id": 5,
  "exp": 1234567890
}
```

#### 4. Endpoints Protegidos

Todos os endpoints de listagem aplicam `apply_scope`:
- `GET /campaigns` - Filtra por departamento
- `GET /users` - Filtra por departamento ou usuário
- `GET /metrics/dashboard` - Métricas com escopo
- `GET /metrics/campaigns/{id}/clicks` - Cliques com escopo

Endpoints de criação/edição validam:
- Departamento obrigatório para GESTOR e COLABORADOR
- Acesso ao recurso antes de editar/deletar

### Frontend (Next.js)

#### 1. Componentes de Dashboard

**DashboardTI** (`frontend/src/components/DashboardTI.tsx`)
- Visão completa de todos os departamentos
- Estatísticas detalhadas por departamento
- Gestão de campanhas globais

**DashboardGestor** (`frontend/src/components/DashboardGestor.tsx`)
- Foco no departamento do gestor
- Métricas e campanhas do departamento
- Gestão de usuários do departamento

**DashboardColaborador** (`frontend/src/components/DashboardColaborador.tsx`)
- Painel pessoal de segurança
- Pontuação de segurança
- Histórico de treinamentos
- Dicas de segurança

#### 2. Interceptor HTTP

**API Service** (`frontend/src/services/api.ts`)
- Adiciona token JWT automaticamente em todas as requisições
- Redireciona para login em caso de 401 Unauthorized
- Limpa localStorage em logout

#### 3. Fluxo de Autenticação

1. Login armazena token JWT e dados do usuário
2. Dashboard identifica role do usuário
3. Renderiza componente específico da role
4. Frontend exibe apenas dados retornados pela API (sem filtros locais)

## 📝 Validações Implementadas

### Backend

1. **Cadastro de Usuário**:
   - Se `role = GESTOR` ou `COLABORADOR` → `department_id` obrigatório
   - Retorna erro 400 se departamento não informado

2. **Criação de Campanha**:
   - TI deve especificar `department_id`
   - GESTOR/COLABORADOR usam seu próprio `department_id`

3. **Envio de Campanha**:
   - Valida acesso à campanha antes de enviar
   - Associa `user_id` em cada `CampaignSend`

4. **Listagem e Visualização**:
   - Filtros automáticos via `apply_scope`
   - Validação de acesso via `check_resource_access`

### Frontend

1. **Exibição Condicional**:
   - Dashboards diferentes por role
   - Funcionalidades visíveis conforme permissões

2. **Segurança**:
   - Frontend não aplica regras de negócio
   - Apenas exibe dados retornados pela API
   - Backend é a fonte da verdade

## 🔧 Migração e Setup

### 1. Instalar Dependências

```bash
cd backend
pip install passlib[bcrypt] python-jose[cryptography]
```

### 2. Executar Migração

```bash
python migrate_rbac.py
```

### 3. Sincronizar Models

```bash
python sync_database.py
```

### 4. Criar Usuários de Teste

```bash
# Criar usuário TI
python create_admin_user.py

# Criar usuários de teste
python create_test_user.py
```

## 🧪 Testando o Sistema

### 1. Testar TI

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ti@empresa.com", "password": "senha123"}'

# Listar todas as campanhas (deve ver todas)
curl -X GET http://localhost:8000/campaigns \
  -H "Authorization: Bearer {TOKEN}"
```

### 2. Testar GESTOR

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "gestor@empresa.com", "password": "senha123"}'

# Listar campanhas (deve ver apenas do departamento)
curl -X GET http://localhost:8000/campaigns \
  -H "Authorization: Bearer {TOKEN}"
```

### 3. Testar COLABORADOR

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "colaborador@empresa.com", "password": "senha123"}'

# Listar campanhas (deve ver apenas as recebidas)
curl -X GET http://localhost:8000/campaigns \
  -H "Authorization: Bearer {TOKEN}"
```

## 📊 Conformidade com LGPD

✅ **Minimização de Dados**: Usuários veem apenas dados necessários
✅ **Segregação**: Departamentos isolados uns dos outros
✅ **Auditoria**: Todas as ações registradas com user_id
✅ **Controle de Acesso**: Baseado em roles e departamentos
✅ **Transparência**: Usuários sabem quais dados acessam

## 🚀 Próximos Passos (Opcional)

- [ ] Implementar logs de auditoria detalhados
- [ ] Adicionar permissões granulares (CRUD por recurso)
- [ ] Implementar refresh tokens
- [ ] Adicionar autenticação de dois fatores
- [ ] Implementar gerenciamento de sessões

## 📚 Referências

- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- LGPD: Lei 13.709/2018

## ✅ Checklist de Implementação

- [x] Enum UserRole criado
- [x] Models atualizados com validações
- [x] Módulo de segurança JWT implementado
- [x] Módulo de controle de acesso criado
- [x] apply_scope aplicado em todos os endpoints
- [x] Validações de cadastro implementadas
- [x] Dashboards específicos por role criados
- [x] Frontend integrado com JWT
- [x] Script de migração criado
- [x] Documentação completa

---

**Implementado por**: GitHub Copilot (Claude Sonnet 4.5)  
**Data**: 27 de janeiro de 2026  
**Projeto**: SafeClicker - TCC
