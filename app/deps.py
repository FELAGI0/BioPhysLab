"""Зависимости FastAPI: cookie-сессия, пользователь (JWT), логирование, rate limit.

Единая точка работы с анонимными сессиями, аутентификацией
и ограничением частоты запросов.
"""

import time
from collections import defaultdict, deque
from uuid import uuid4

from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import decode_token
from app.db import get_db
from app.models import ModuleName, Session, UsageLog, User

# In-memory хранилище rate limit: cookie_id -> очередь timestamp'ов запросов.
# Для одного процесса uvicorn этого достаточно (учебный MVP без several workers).
_RATE_LIMIT_STORE: dict[str, deque[float]] = defaultdict(deque)


async def get_current_user_optional(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User | None:
    """Читает JWT из Authorization: Bearer ...; возвращает User или None.

    Не падает при отсутствии/невалидности токена — авторизация опциональна.
    """
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None

    email = decode_token(auth.removeprefix("Bearer ").strip())
    if email is None:
        return None

    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_from_token(db: AsyncSession, token: str) -> User | None:
    """Находит пользователя по валидному JWT (для /api/auth/me)."""
    email = decode_token(token)
    if email is None:
        return None
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_or_create_session(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
) -> Session:
    """Возвращает сессию из cookie, при отсутствии — создаёт новую и ставит cookie.

    Cookie: httponly, samesite=lax, срок 1 год.
    Анонимная сессия работает и без авторизации (user не используется напрямую:
    привязка записей к пользователю идёт через user_id в UsageLog).
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
    db: AsyncSession,
    session_id: str,
    module: ModuleName,
    duration_ms: int | None,
    request_text: str | None = None,
    response_text: str | None = None,
    user_id: int | None = None,
) -> UsageLog:
    """Записывает в usage_logs один вызов AI-модуля и возвращает созданную запись."""
    entry = UsageLog(
        session_id=session_id,
        module=module,
        duration_ms=duration_ms,
        request_text=request_text,
        response_text=response_text,
        user_id=user_id,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


def rate_limit(cookie_id: str) -> None:
    """Ограничение частоты: не более RATE_LIMIT_PER_HOUR запросов в час на сессию.

    Старые timestamp'ы (старее часа) удаляются при каждом вызове.
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
