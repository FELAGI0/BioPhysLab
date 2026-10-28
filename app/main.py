"""Точка входа FastAPI-приложения BioPhysLab."""

from fastapi import Depends, FastAPI
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.routers import ecg, explain, solver
from app.services.stats import get_stats

app = FastAPI(title="BioPhysLab", version="0.1.0")

app.include_router(ecg.router, prefix="/api")
app.include_router(solver.router, prefix="/api")
app.include_router(explain.router, prefix="/api")


@app.get("/health")
async def health() -> dict[str, str]:
    """Проверка живости сервиса."""
    return {"status": "ok", "service": "BioPhysLab"}


@app.get("/api/stats")
async def stats(db: AsyncSession = Depends(get_db)) -> dict:
    """Агрегированная статистика использования BioPhysLab."""
    return await get_stats(db)

