"""Единый AI-клиент: единственная точка HTTP-запросов к провайдеру.

Эндпоинты роутеров НИКОГДА не ходят в HTTP напрямую — только через ask_ai().
Здесь же: таймаут, нормализация ошибок (502), логирование в stdout.
"""

import base64
import logging
import time

import httpx
from fastapi import HTTPException

from app.config import settings

logger = logging.getLogger("biophyslab.ai_client")

# Эндпоинты провайдеров (генерация контента).
_GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
_OPENAI_URL = "https://api.openai.com/v1/chat/completions"


async def ask_ai(prompt: str, image_b64: str | None = None, module: str = "unknown") -> str:
    """Отправляет промпт (и опционально изображение в base64) в AI-провайдер.

    Возвращает текст ответа. При пустом ответе или ошибке сети — HTTPException(502).
    Логирует в stdout: module, latency_ms, status.
    """
    started = time.monotonic()
    status = "ok"

    try:
        if settings.AI_PROVIDER == "gemini":
            text = await _ask_gemini(prompt, image_b64)
        else:
            text = await _ask_openai(prompt, image_b64)

        if text is None or not text.strip():
            status = "empty_response"
            raise HTTPException(status_code=502, detail="AI вернул пустой ответ")

        return text

    except HTTPException:
        raise
    except httpx.HTTPError:
        # Любая сетевая/таймаут-ошибка httpx → единый 502 без внутренних деталей.
        status = "http_error"
        raise HTTPException(status_code=502, detail="AI сервис недоступен")
    finally:
        latency_ms = round((time.monotonic() - started) * 1000)
        logger.info(
            "ai_call module=%s status=%s latency_ms=%s provider=%s model=%s",
            module, status, latency_ms, settings.AI_PROVIDER, settings.AI_MODEL,
        )
        # Дублируем в stdout, чтобы лог был виден без настройки logging.
        print(
            f"[ai_call] module={module} status={status} latency_ms={latency_ms} "
            f"provider={settings.AI_PROVIDER} model={settings.AI_MODEL}",
            flush=True,
        )


async def _ask_gemini(prompt: str, image_b64: str | None) -> str | None:
    """Запрос к Gemini generateContent (текст + опционально inline_data изображение)."""
    parts: list[dict] = [{"text": prompt}]
    if image_b64 is not None:
        parts.append(
            {
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": image_b64,
                }
            }
        )

    url = _GEMINI_URL.format(model=settings.AI_MODEL)
    async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
        response = await client.post(
            url,
            params={"key": settings.AI_API_KEY},
            json={
                "contents": [
                    {
                        "role": "user",
                        "parts": parts,
                    }
                ]
            },
        )
        response.raise_for_status()

    data = response.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return None
    content = candidates[0].get("content", {})
    parts_resp = content.get("parts", [])
    if not parts_resp:
        return None
    return parts_resp[0].get("text")


async def _ask_openai(prompt: str, image_b64: str | None) -> str | None:
    """Запрос к OpenAI chat/completions (текст + опционально image_url с data-URI)."""
    content: list[dict]
    if image_b64 is not None:
        content = [
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
            },
        ]
    else:
        content = [{"type": "text", "text": prompt}]

    async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
        response = await client.post(
            _OPENAI_URL,
            headers={"Authorization": f"Bearer {settings.AI_API_KEY}"},
            json={
                "model": settings.AI_MODEL,
                "messages": [{"role": "user", "content": content}],
            },
        )
        response.raise_for_status()

    data = response.json()
    choices = data.get("choices", [])
    if not choices:
        return None
    message = choices[0].get("message", {})
    return message.get("content")
