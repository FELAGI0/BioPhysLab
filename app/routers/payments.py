"""Роутер платежей ЮKassa — ЗАГОТОВКА, без реальных платежей.

Оба эндпоинта ничего не списывают и не ходят в API ЮKassa: create отдаёт
фейковую ссылку checkout, webhook просто принимает уведомление. Реальная
интеграция подключается позже через YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY
(см. app/config.py и .env.example).
"""

import logging

from fastapi import APIRouter

from app.config import settings

logger = logging.getLogger("biophyslab.payments")

router = APIRouter(tags=["payments"])


@router.post("/payments/create", response_model=None)
async def create_payment() -> dict[str, str]:
    """Возвращает фейковую ссылку на checkout ЮKassa (платежи в разработке).

    Заглушка: реальное создание платежа потребует shop_id и secret key
    из настроек. Пока возвращаем заглушечный URL, не трогая API ЮKassa.
    """
    logger.info(
        "payment_stub action=create shop_id_configured=%s",
        bool(settings.YOOKASSA_SHOP_ID),
    )
    return {"payment_url": "https://yookassa.ru/checkout/payments-in-development"}


@router.post("/payments/webhook", response_model=None)
async def payment_webhook() -> dict[str, str]:
    """Принимает уведомление ЮKassa о статусе платежа (заглушка).

    Тело не разбирается и не проверяется: реальная интеграция должна
    валидировать подпись уведомления, прежде чем доверять статусу.
    """
    logger.info("payment_stub action=webhook")
    return {"status": "ok"}
