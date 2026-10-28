"""Зависимости FastAPI: cookie-сессия, логирование использования, rate limit.

Единая точка работы с анонимными сессиями и ограничением частоты запросов.
"""

import time
from collections import defaultdict, deque
from uuid import uuid4

from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.models import ModuleName, Session, UsageLog

# In-memory хранилище rate limit: cookie_id -> очередь timestamp'ов запросов.
# Для одного процесса uvicorn этого достаточно (учебный MVP без several workers).
_RATE_LIMIT_STORE: dict[str, deque[float]] = defaultdict(deque)


async def get_or_create_session(
    request: Request, response: Response, db: AsyncSession = Depends(get_db)
) -> Session:
    """Возвращает сессию из cookie, при отсутствии — создаёт новую и ставит cookie.

    Cookie: httponly, samesite=lax, срок 1 год.
    """
    cookie_value = request.cookies.get(settings.SESSION_COOKIE_NAME)

    if cookie_value:
        result = await db.execute(select(Session).where(Session.id == cookie_value))
        existing = result.scalar_one_or_none()
        if existing is not None:
            return existing

    new_session = Session(id=str(uuid4()))
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)

    # secure=False, т.к. MVP работает по HTTP без TLS.
    # При деплое на HTTPS обязательно включить secure=True.
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=new_session.id,
        httponly=True,
        samesite="lax",
        max_age=365 * 24 * 60 * 60,
        secure=False,
    )
    return new_session


async def log_usage(
    db: AsyncSession, session_id: str, module: ModuleName, duration_ms: int | None
) -> None:
    """Записывает в usage_logs один вызов AI-модуля (для статистики)."""
    db.add(UsageLog(session_id=session_id, module=module, duration_ms=duration_ms))
    await db.commit()


def rate_limit(cookie_id: str) -> None:
    """Ограничение частоты: не более RATE_LIMIT_PER_HOUR запросов в час на сессию.

    Старые timestamp'ы (старше часа) удаляются при каждом вызове.
    """
    now = time.monotonic()
    window_seconds = 3600.0

    timestamps = _RATE_LIMIT_STORE[cookie_id]
    # Убираем записи старше часа (окно скользящее).
    while timestamps and timestamps[0] < now - window_seconds:
        timestamps.popleft()

    if len(timestamps) >= settings.RATE_LIMIT_PER_HOUR:
        raise HTTPException(
            status_code=429, detail="Слишком много запросов. Попробуйте позже."
        )

    timestamps.append(now)
