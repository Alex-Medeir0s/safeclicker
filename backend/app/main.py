from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, users, campaigns, templates, departments, auth, metrics
from app.core.database import Base, engine

# Create tables  
Base.metadata.create_all(bind=engine)

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


@app.get("/")
async def root():
    return {"message": "Bem-vindo ao SafeClicker API"}


