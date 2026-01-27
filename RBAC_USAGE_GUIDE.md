# 🚀 Guia de Uso - Sistema RBAC SafeClicker

## ⚡ Início Rápido

### 1. Preparar o Ambiente

```powershell
# Backend - Instalar dependências
cd backend
pip install -r requirements.txt

# Frontend - Instalar dependências (se necessário)
cd ..\frontend
npm install
```

### 2. Executar Migração

```powershell
cd ..\backend
python migrate_rbac.py
```

### 3. Iniciar Servidores

**Terminal 1 - Backend:**
```powershell
cd backend
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

## 👥 Usuários de Teste

Após executar `python create_test_user.py`, você terá:

### Usuário TI
- **Email**: `ti@safeclicker.com`
- **Senha**: `senha123`
- **Acesso**: Todos os departamentos e usuários

### Usuário Gestor
- **Email**: `gestor.ti@safeclicker.com`
- **Senha**: `senha123`
- **Acesso**: Apenas departamento de TI

### Usuário Colaborador
- **Email**: `colaborador.ti@safeclicker.com`
- **Senha**: `senha123`
- **Acesso**: Apenas seus próprios dados

## 🎯 Como Testar o RBAC

### Teste 1: TI vê tudo

1. Faça login com `ti@safeclicker.com`
2. Acesse o Dashboard
3. Você verá:
   - ✅ Todos os departamentos
   - ✅ Todas as campanhas
   - ✅ Todos os usuários
   - ✅ Estatísticas globais

### Teste 2: Gestor vê apenas seu departamento

1. Faça logout (ou use navegador anônimo)
2. Faça login com `gestor.ti@safeclicker.com`
3. Acesse o Dashboard
4. Você verá:
   - ✅ Apenas departamento de TI
   - ✅ Apenas campanhas do TI
   - ✅ Apenas usuários do TI
   - ❌ Não vê outros departamentos

### Teste 3: Colaborador vê apenas seus dados

1. Faça logout (ou use navegador anônimo)
2. Faça login com `colaborador.ti@safeclicker.com`
3. Acesse o Dashboard
4. Você verá:
   - ✅ Seu desempenho pessoal
   - ✅ Campanhas que recebeu
   - ✅ Sua pontuação de segurança
   - ❌ Não vê outros usuários
   - ❌ Não vê outras campanhas

## 📝 Criar Novos Usuários

### Via API

```bash
# Criar Gestor
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN_TI}" \
  -d '{
    "email": "novo.gestor@empresa.com",
    "full_name": "João Silva",
    "role": "GESTOR",
    "department_id": 1,
    "password": "senha123"
  }'

# Criar Colaborador
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN_TI}" \
  -d '{
    "email": "novo.colaborador@empresa.com",
    "full_name": "Maria Santos",
    "role": "COLABORADOR",
    "department_id": 1,
    "password": "senha123"
  }'
```

### Via Python

```python
from app.models.user import User, UserRole
from app.core.database import SessionLocal
from app.core.security import get_password_hash

db = SessionLocal()

# Criar Gestor
gestor = User(
    email="gestor.rh@empresa.com",
    full_name="Gestor RH",
    role=UserRole.GESTOR,
    department_id=2,  # ID do departamento RH
    hashed_password=get_password_hash("senha123"),
    is_active=True
)
db.add(gestor)
db.commit()
```

## 🔐 Regras de Validação

### ❌ Isso NÃO Funciona:

```python
# Criar GESTOR sem departamento
{
    "email": "gestor@empresa.com",
    "role": "GESTOR",
    "department_id": null  # ❌ ERRO 400
}

# Criar COLABORADOR sem departamento
{
    "email": "colaborador@empresa.com",
    "role": "COLABORADOR",
    "department_id": null  # ❌ ERRO 400
}

# Gestor tentando ver dados de outro departamento
GET /campaigns  # ❌ Retorna apenas do próprio departamento
```

### ✅ Isso Funciona:

```python
# Criar TI sem departamento
{
    "email": "ti@empresa.com",
    "role": "TI",
    "department_id": null  # ✅ OK
}

# TI pode especificar departamento ao criar campanha
{
    "name": "Campanha RH",
    "department_id": 2  # ✅ OK para TI
}

# Gestor cria campanha para seu departamento
{
    "name": "Campanha TI",
    "department_id": 1  # ✅ Usa automaticamente seu departamento
}
```

## 🎨 Dashboards por Role

### Dashboard TI
- 📊 Visão completa de todos os departamentos
- 📈 Estatísticas globais
- 👥 Lista todos os usuários
- 🎯 Todas as campanhas

### Dashboard Gestor
- 📊 Desempenho do departamento
- 📈 Estatísticas do departamento
- 👥 Usuários do departamento
- 🎯 Campanhas do departamento

### Dashboard Colaborador
- 🏆 Pontuação de segurança pessoal
- 📧 Campanhas recebidas
- 📊 Desempenho individual
- 💡 Dicas de segurança

## 🔍 Troubleshooting

### Erro: "Token inválido"
- Faça logout e login novamente
- Verifique se o token está sendo enviado no header `Authorization: Bearer {token}`

### Erro: "Role GESTOR requer department_id obrigatório"
- Ao criar usuário GESTOR ou COLABORADOR, sempre informe `department_id`

### Erro: "Acesso negado"
- Você está tentando acessar um recurso fora do seu escopo
- GESTOR só acessa seu departamento
- COLABORADOR só acessa seus próprios dados

### Dados não aparecem no dashboard
- Verifique se o usuário tem o departamento correto
- Execute `python sync_database.py` para sincronizar
- Verifique os logs do backend para erros de filtro

## 📞 Suporte

Em caso de dúvidas:
1. Verifique os logs do backend (`uvicorn`)
2. Verifique o console do navegador (F12)
3. Consulte [RBAC_IMPLEMENTATION.md](RBAC_IMPLEMENTATION.md)

## ✅ Checklist de Verificação

Antes de colocar em produção:

- [ ] Todos os usuários GESTOR têm `department_id`
- [ ] Todos os usuários COLABORADOR têm `department_id`
- [ ] Todas as campanhas têm `department_id`
- [ ] JWT está funcionando corretamente
- [ ] Dashboards renderizam conforme a role
- [ ] Testes de acesso por role passam
- [ ] SECRET_KEY do JWT foi alterado (produção)
- [ ] Senhas são hashadas com bcrypt
- [ ] HTTPS está habilitado (produção)

---

**Dúvidas?** Consulte a documentação completa em [RBAC_IMPLEMENTATION.md](RBAC_IMPLEMENTATION.md)
