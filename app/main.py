"""Точка входа FastAPI-приложения BioPhysLab."""

from fastapi import FastAPI

from app.routers import ecg, explain, solver

app = FastAPI(title="BioPhysLab", version="0.1.0")

app.include_router(ecg.router, prefix="/api")
app.include_router(solver.router, prefix="/api")
app.include_router(explain.router, prefix="/api")


@app.get("/health")
async def health() -> dict[str, str]:
    """Проверка живости сервиса."""
    return {"status": "ok", "service": "BioPhysLab"}
