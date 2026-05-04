import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, users, campaigns, templates, departments, auth, metrics, quizzes
from app.core.database import Base, engine
from app.services.campaign_scheduler import campaign_scheduler_loop
from app.core.config import get_settings
from app.core.config import get_settings

# Create tables  
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not create tables at startup: {e}")
    pass

# Log database URL for debugging (do NOT print in production)
try:
    settings = get_settings()
    print(f"[STARTUP] Using DATABASE_URL={settings.database_url}")
except Exception:
    print("[STARTUP] Could not read settings")

# Log database URL for debugging (do NOT print in production)
try:
    settings = get_settings()
    print(f"[STARTUP] Using DATABASE_URL={settings.database_url}")
except Exception:
    print("[STARTUP] Could not read settings")

app = FastAPI(
    title="SafeClicker API",
    description="API para gerenciamento de campanhas de phishing e treinamento de segurança",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://172.28.224.1:3000",
        "http://172.28.224.1:3001",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Include routers - sem prefixo /api pois será adicionado pelo frontend
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(metrics.router)
app.include_router(users.router)
app.include_router(campaigns.router)
app.include_router(templates.router)
app.include_router(departments.router)
app.include_router(quizzes.router)


@app.on_event("startup")
async def start_campaign_scheduler():
    app.state.campaign_scheduler_task = asyncio.create_task(campaign_scheduler_loop())


@app.on_event("shutdown")
async def stop_campaign_scheduler():
    task = getattr(app.state, "campaign_scheduler_task", None)
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


@app.get("/")
async def root():
    return {"message": "Bem-vindo ao SafeClicker API"}


