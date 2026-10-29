"""Роутер модуля объяснения явлений под уровень слушателя."""

import time
from typing import Literal

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_or_create_session, log_usage, rate_limit
from app.models import ModuleName, Session
from app.prompts import EXPLAIN_PROMPT
from app.services.ai_client import ask_ai

router = APIRouter(tags=["explain"])

Level = Literal["школьник", "студент", "врач"]


class ExplainRequest(BaseModel):
    """Тело запроса /api/explain: тема и уровень слушателя."""

    topic: str = Field(min_length=2, max_length=200, description="Явление или понятие")
    level: Level = Field(description="Уровень слушателя")


@router.post("/explain", response_model=None)
async def explain_topic(
    body: ExplainRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    session: Session = Depends(get_or_create_session),
) -> dict[str, str]:
    """Объясняет явление/понятие под выбранный уровень слушателя."""
    rate_limit(request.cookies.get("biophyslab_sid") or session.id)

    started = time.monotonic()
    result = await ask_ai(
        EXPLAIN_PROMPT.format(topic=body.topic, level=body.level), module="explain"
    )
    duration_ms = round((time.monotonic() - started) * 1000)

    entry = await log_usage(
        db,
        session.id,
        ModuleName.explain,
        duration_ms,
        request_text=f"{body.topic} (уровень: {body.level})",
        response_text=result,
    )
    return {"result": result, "id": entry.id}
