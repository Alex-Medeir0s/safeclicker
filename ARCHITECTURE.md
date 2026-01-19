# Arquitetura - SafeClicker

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│                     http://localhost:3000                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐     │
│  │  Dashboard      │  │  Campaigns   │  │  Templates     │     │
│  │  Users          │  │  Reports     │  │  Departments   │     │
│  │  Training       │  │  Analytics   │  │  Settings      │     │
│  └─────────────────┘  └──────────────┘  └────────────────┘     │
│           │                  │                  │                 │
│           └──────────────────┼──────────────────┘                │
│                              │                                    │
│           ┌───────────────────────────────────┐                 │
│           │  Services (api.ts)                │                 │
│           │  - usersAPI                       │                 │
│           │  - campaignsAPI                   │                 │
│           │  - templatesAPI                   │                 │
│           │  - departmentsAPI                 │                 │
│           │  - healthAPI                      │                 │
│           └───────────────────────────────────┘                 │
│                      │                                           │
└──────────────────────┼───────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │ HTTP/CORS                   │
        │ (GET, POST, PUT, DELETE)    │
        │ JSON                        │
        │                             │
┌───────┴─────────────────────────────┴──────────────────────────┐
│                    BACKEND (FastAPI)                            │
│              http://localhost:8000/docs                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Routes (API Endpoints)                   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  /health          - Health check                          │ │
│  │  /users           - CRUD de usuários                      │ │
│  │  /campaigns       - CRUD de campanhas                     │ │
│  │  /templates       - CRUD de templates                     │ │
│  │  /departments     - CRUD de departamentos                 │ │
│  │  /microtrainings  - CRUD de microtreinamentos            │ │
│  │  /campaign_sends  - Envios de campanhas                   │ │
│  │  /click_events    - Eventos de clique                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌───────────────────────────┴────────────────────────┐         │
│  │                                                    │          │
│  ├────────────────────┐  ┌─────────────────────────┐ │         │
│  │  Models            │  │  Schemas               │ │         │
│  ├────────────────────┤  ├─────────────────────────┤ │         │
│  │  User              │  │  UserCreate/Read       │ │         │
│  │  Campaign          │  │  CampaignCreate/Read   │ │         │
│  │  Template          │  │  TemplateCreate/Read   │ │         │
│  │  Department        │  │  DepartmentCreate/Read │ │         │
│  │  CampaignSend      │  │  CampaignSendRead      │ │         │
│  │  ClickEvent        │  │  ClickEventRead        │ │         │
│  │  Microtraining     │  │                        │ │         │
│  └────────────────────┘  └─────────────────────────┘ │         │
│                              │                         │         │
│                              ▼                         │         │
│  ┌───────────────────────────────────────────────────┐│         │
│  │       Core (Database & Configuration)            ││         │
│  ├───────────────────────────────────────────────────┤│         │
│  │  config.py    - Variáveis de ambiente            ││         │
│  │  database.py  - Connection pool SQLAlchemy       ││         │
│  └───────────────────────────────────────────────────┘│         │
│                              │                         │         │
│                              └─────────────────────────┘         │
│                                    │                             │
└────────────────────────────────────┼─────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │  psycopg2 Driver               │
                    │  (PostgreSQL Adapter)          │
                    └────────────────┬────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────────┐
│                    DATABASE (PostgreSQL)                         │
│                    safeclicker                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐           │
│  │ users        │  │ departments │  │ campaigns    │           │
│  │              │  │             │  │              │           │
│  │ id [PK]      │  │ id [PK]     │  │ id [PK]      │           │
│  │ email [U]    │  │ name [U]    │  │ name         │           │
│  │ full_name    │  │ description │  │ template_id  │───┐       │
│  │ hashed_pass  │  │ created_at  │  │ created_by   │   │       │
│  │ dept_id [FK] ──→ id          │  │ status       │   │       │
│  │ created_at   │  │ updated_at  │  │ created_at   │   │       │
│  │ updated_at   │  └─────────────┘  │ updated_at   │   │       │
│  └──────────────┘                   └──────────────┘   │       │
│                                                        │       │
│  ┌──────────────────┐  ┌────────────────────┐        │       │
│  │ campaign_sends   │  │ click_events       │        │       │
│  │                  │  │                    │        │       │
│  │ id [PK]          │  │ id [PK]            │        │       │
│  │ campaign_id [FK] │──│ campaign_send_id[FK]       │       │
│  │ recipient_email  │  │ link_url           │        │       │
│  │ sent_at          │  │ clicked_at         │        │       │
│  │ opened           │  │ ip_address         │        │       │
│  │ opened_at        │  │ user_agent         │        │       │
│  │ bounced          │  │ created_at         │        │       │
│  │ created_at       │  └────────────────────┘        │       │
│  └──────────────────┘                               │       │
│                                                     │       │
│  ┌──────────────────┐  ┌────────────────────┐      │       │
│  │ templates [FK] ◄─────────────────────────────┘       │
│  │                  │  │ microtrainings     │           │
│  │ id [PK]          │  │                    │           │
│  │ name [U]         │  │ id [PK]            │           │
│  │ subject          │  │ title              │           │
│  │ body             │  │ content            │           │
│  │ description      │  │ duration_minutes   │           │
│  │ created_at       │  │ created_at         │           │
│  │ updated_at       │  │ updated_at         │           │
│  └──────────────────┘  └────────────────────┘           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Fluxo de Comunicação

### 1. Frontend → Backend

```
Usuario interage com a UI
          │
          ▼
React Component
          │
          ▼
Service (usersAPI, campaignsAPI, etc)
          │
          ▼
Axios HTTP Request
          │
          ├─ GET  /users
          ├─ POST /campaigns
          ├─ PUT  /users/{id}
          └─ DELETE /templates/{id}
          │
          ▼
CORS Validation
          │
          ▼
FastAPI Route Handler
```

### 2. Backend → Database

```
FastAPI Route
          │
          ▼
Dependency Injection (get_db)
          │
          ▼
SQLAlchemy ORM
          │
          ├─ Create: db.add() → db.commit()
          ├─ Read:   db.query().filter()
          ├─ Update: setattr() → db.commit()
          └─ Delete: db.delete() → db.commit()
          │
          ▼
psycopg2 Driver
          │
          ▼
PostgreSQL Execute
          │
          ▼
Response JSON
```

## Stack Tecnológico

### Frontend
- **Framework**: Next.js 14+
- **UI Framework**: React 18+
- **Language**: TypeScript
- **HTTP Client**: Axios
- **Styling**: CSS Modules / Tailwind

### Backend
- **Framework**: FastAPI
- **Server**: Uvicorn
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic
- **Database**: PostgreSQL
- **Database Driver**: psycopg2

### Infrastructure
- **Environment**: Python 3.12
- **Package Manager**: pip (Python), npm (Node.js)
- **Version Control**: Git
- **Documentation**: OpenAPI/Swagger (Auto-generated)

## Segurança

```
FRONTEND                          BACKEND
  │                                  │
  │──── CORS Headers ──────────────→│
  │                                  │
  │     ✓ Allow Origin               │
  │     ✓ Allow Methods              │
  │     ✓ Allow Headers              │
  │                                  │
  │←───── JSON Response ────────────│
  │                                  │
  └──────────────────────────────────┘
```

## Próximas Implementações

```
┌─────────────────────────────────────┐
│  Authentication & Authorization     │
│  ├─ JWT Tokens                      │
│  ├─ Role-based Access Control       │
│  └─ Password Hashing                │
├─────────────────────────────────────┤
│  Advanced Features                  │
│  ├─ Email Notifications             │
│  ├─ Analytics & Reporting           │
│  ├─ Scheduled Campaigns             │
│  ├─ A/B Testing                     │
│  └─ User Behavior Analytics         │
├─────────────────────────────────────┤
│  DevOps & Deployment                │
│  ├─ Docker Containerization         │
│  ├─ CI/CD Pipeline                  │
│  ├─ Cloud Deployment                │
│  └─ Monitoring & Logging            │
└─────────────────────────────────────┘
```
