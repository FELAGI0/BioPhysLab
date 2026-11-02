"""Роутер модуля ЭКГ: разбор картинки ЭКГ через AI."""

import base64
import time

from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import (
    get_current_user_optional,
    get_or_create_session,
    log_usage,
    rate_limit,
)
from app.models import ModuleName, Session, User
from app.prompts import ECG_PROMPT, OFF_TOPIC_MARKER
from app.services.ai_client import ask_ai

router = APIRouter(tags=["ecg"])

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 МБ
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}


def _detect_image_type(data: bytes) -> str | None:
    """Определяет реальный формат по магическим байтам.

    Content-Type приходит от клиента и ему нельзя доверять: чтобы data URL
    в AI-запросе всегда соответствовал содержимому, MIME берём из байтов.
    """
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8"):
        return "image/jpeg"
    return None


@router.post("/ecg", response_model=None)
async def analyze_ecg(
    file: UploadFile,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    session: Session = Depends(get_or_create_session),
    user: User | None = Depends(get_current_user_optional),
) -> dict[str, str]:
    """Разбирает изображение ЭКГ (jpg/png, до 5 МБ) и возвращает анализ AI."""
    # Rate limit по id cookie-сессии.
    rate_limit(request.cookies.get("biophyslab_sid") or session.id)

    # Размер проверяем ДО чтения: сначала по Content-Length, затем по факту.
    declared = request.headers.get("content-length")
    if declared is not None:
        try:
            declared_bytes = int(declared)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Некорректный заголовок Content-Length"
            )
        if declared_bytes > MAX_IMAGE_BYTES + 2048:
            raise HTTPException(status_code=413, detail="Файл слишком большой (максимум 5 МБ)")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400, detail="Допустимы только изображения jpg или png"
        )

    data = await file.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Файл слишком большой (максимум 5 МБ)")

    if not data:
        raise HTTPException(status_code=400, detail="Пустой файл")

    # MIME определяем по магическим байтам, а не по заявленному Content-Type:
    # фактический формат всегда должен совпадать с data URL в AI-запросе.
    detected = _detect_image_type(data)
    if detected is None:
        raise HTTPException(
            status_code=400, detail="Файл не является корректным изображением jpg или png"
        )

    image_b64 = base64.b64encode(data).decode("ascii")
    image_mime = detected

    started = time.monotonic()
    result = await ask_ai(
        ECG_PROMPT, image_b64=image_b64, module="ecg", image_mime=image_mime
    )
    duration_ms = round((time.monotonic() - started) * 1000)

    # Safety guard: off-topic изображение не сохраняется в историю.
    if result.startswith(OFF_TOPIC_MARKER):
        return {"result": result, "id": None}

    entry = await log_usage(
        db,
        session.id,
        ModuleName.ecg,
        duration_ms,
        request_text="Изображение ЭКГ (jpg/png)",
        response_text=result,
        user_id=user.id if user else None,
    )
    return {"result": result, "id": entry.id}
