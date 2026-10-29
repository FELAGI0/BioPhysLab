"""Роутер модуля решения задач по биофизике."""

import time

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_or_create_session, log_usage, rate_limit
from app.models import ModuleName, Session
from app.prompts import SOLVER_PROMPT
from app.services.ai_client import ask_ai

router = APIRouter(tags=["solver"])


class SolverRequest(BaseModel):
    """Тело запроса /api/solver: текст задачи по биофизике."""

    task: str = Field(min_length=5, max_length=2000, description="Условие задачи")


@router.post("/solver", response_model=None)
async def solve_task(
    body: SolverRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    session: Session = Depends(get_or_create_session),
) -> dict[str, str]:
    """Решает задачу по биофизике пошагово и возвращает решение AI."""
    rate_limit(request.cookies.get("biophyslab_sid") or session.id)

    started = time.monotonic()
    result = await ask_ai(SOLVER_PROMPT.format(task=body.task), module="solver")
    duration_ms = round((time.monotonic() - started) * 1000)

    entry = await log_usage(
        db,
        session.id,
        ModuleName.solver,
        duration_ms,
        request_text=body.task,
        response_text=result,
    )
    return {"result": result, "id": entry.id}
