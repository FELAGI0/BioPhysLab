"""Роутер модуля ЭКГ: разбор картинки ЭКГ через AI."""

import base64
import time

from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_or_create_session, log_usage, rate_limit
from app.models import ModuleName, Session
from app.prompts import ECG_PROMPT
from app.services.ai_client import ask_ai

router = APIRouter(tags=["ecg"])

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 МБ
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}


@router.post("/ecg", response_model=None)
async def analyze_ecg(
    file: UploadFile,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    session: Session = Depends(get_or_create_session),
) -> dict[str, str]:
    """Разбирает изображение ЭКГ (jpg/png, до 5 МБ) и возвращает анализ AI."""
    # Rate limit по id cookie-сессии.
    rate_limit(request.cookies.get("biophyslab_sid") or session.id)

    # Размер проверяем ДО чтения: сначала по Content-Length, затем по факту.
    declared = request.headers.get("content-length")
    if declared is not None and int(declared) > MAX_IMAGE_BYTES + 2048:
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

    image_b64 = base64.b64encode(data).decode("ascii")

    started = time.monotonic()
    result = await ask_ai(ECG_PROMPT, image_b64=image_b64, module="ecg")
    duration_ms = round((time.monotonic() - started) * 1000)

    await log_usage(db, session.id, ModuleName.ecg, duration_ms)
    return {"result": result}
