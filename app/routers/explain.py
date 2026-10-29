"""Роутер модуля объяснения явлений под уровень слушателя."""

import time
from typing import Literal

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import (
    get_current_user_optional,
    get_or_create_session,
    log_usage,
    rate_limit,
)
from app.models import ModuleName, Session, User
from app.prompts import EXPLAIN_PROMPT, OFF_TOPIC_MARKER
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
    user: User | None = Depends(get_current_user_optional),
) -> dict[str, str]:
    """Объясняет явление/понятие под выбранный уровень слушателя."""
    rate_limit(request.cookies.get("biophyslab_sid") or session.id)

    started = time.monotonic()
    result = await ask_ai(
        EXPLAIN_PROMPT.format(topic=body.topic, level=body.level), module="explain"
    )
    duration_ms = round((time.monotonic() - started) * 1000)

    # Safety guard: off-topic запрос не сохраняется в историю.
    if result.startswith(OFF_TOPIC_MARKER):
        return {"result": result, "id": None}

    entry = await log_usage(
        db,
        session.id,
        ModuleName.explain,
        duration_ms,
        request_text=f"{body.topic} (уровень: {body.level})",
        response_text=result,
        user_id=user.id if user else None,
    )
    return {"result": result, "id": entry.id}
