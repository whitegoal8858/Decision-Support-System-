import os
import sys

# Ensure backend root is at index 0 of sys.path to avoid collisions
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.core.database import engine, Base
from app.api import (
    auth, dashboard, projects, milestones, financials,
    risks, documents, inspections, progress, uploads,
    chat, reports, users
)
from app.seed.seed_data import seed_database

# UP Tourism Decision Support System - Reload Timestamp v2
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="LLM-Powered Project Monitoring & Decision Support System for Department of Tourism & Culture, Government of Uttar Pradesh",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow development and docker origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(projects.router, prefix=api_prefix)
app.include_router(milestones.router, prefix=api_prefix)
app.include_router(financials.router, prefix=api_prefix)
app.include_router(risks.router, prefix=api_prefix)
app.include_router(documents.router, prefix=api_prefix)
app.include_router(inspections.router, prefix=api_prefix)
app.include_router(progress.router, prefix=api_prefix)
app.include_router(uploads.router, prefix=api_prefix)
app.include_router(chat.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)

@app.on_event("startup")
def on_startup():
    print("Initializing application state...")
    seed_database()

@app.get("/api/info")
def root_info():
    return {
        "system": settings.PROJECT_NAME,
        "department": "Department of Tourism & Culture, Government of Uttar Pradesh",
        "status": "OPERATIONAL",
        "version": "1.0.0",
        "api_docs": "/docs",
        "demo_data_notice": "SYNTHETIC DEMO DATA"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "llm_provider": settings.LLM_PROVIDER,
        "environment": "hackathon_mvp"
    }

# Mount Frontend static build so UI works directly on port 8000
frontend_dist = os.path.abspath(os.path.join(current_dir, "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_root_ui():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa_fallback(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    is_prod = os.environ.get("RENDER") is not None
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=not is_prod)
