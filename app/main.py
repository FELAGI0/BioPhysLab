"""Точка входа FastAPI-приложения BioPhysLab."""

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.routers import ecg, explain, history, solver
from app.services.stats import get_stats

app = FastAPI(title="BioPhysLab", version="0.1.0")

# Vite dev-сервер на 5173. В продакшене заменить на реальный домен.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ecg.router, prefix="/api")
app.include_router(solver.router, prefix="/api")
app.include_router(explain.router, prefix="/api")
app.include_router(history.router, prefix="/api")


@app.get("/health")
async def health() -> dict[str, str]:
    """Проверка живости сервиса."""
    return {"status": "ok", "service": "BioPhysLab"}


@app.get("/api/stats")
async def stats(db: AsyncSession = Depends(get_db)) -> dict:
    """Агрегированная статистика использования BioPhysLab."""
    return await get_stats(db)

