"""Заполнение БД демо-данными: сессии и логи использования для /api/stats.

Запуск (из корня проекта, при поднятой БД):
    .venv\\Scripts\\python scripts\\seed_demo.py
"""

import asyncio
from uuid import uuid4

from sqlalchemy import select

from app.db import async_session_factory
from app.models import ModuleName, Session, UsageLog

# Демо-сессии: фиксированные UUID, чтобы повторный запуск не плодил дубликаты.
DEMO_SESSION_IDS = [
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222",
    "33333333-3333-3333-3333-333333333333",
]

# Демо-логи: (module, duration_ms) — правдоподобные времена ответа AI.
DEMO_LOGS: list[tuple[ModuleName, int]] = [
    (ModuleName.solver, 4120),
    (ModuleName.solver, 3890),
    (ModuleName.solver, 5210),
    (ModuleName.explain, 2760),
    (ModuleName.explain, 3140),
    (ModuleName.ecg, 6840),
    (ModuleName.ecg, 7390),
    (ModuleName.ecg, 6120),
]


async def seed() -> None:
    """Создаёт демо-сессии и логи, пропуская уже существующие."""
    async with async_session_factory() as db:
        for sid in DEMO_SESSION_IDS:
            existing = await db.execute(select(Session).where(Session.id == sid))
            if existing.scalar_one_or_none() is None:
                db.add(Session(id=sid))
        await db.commit()

        existing_logs = await db.scalar(select(Session.id).limit(1))
        # Логи добавляем один раз: если usage_logs уже не пуст — пропускаем.
        from sqlalchemy import func

        count = await db.scalar(select(func.count()).select_from(UsageLog))
        if count == 0:
            # Раскидываем логи по демо-сессиям по кругу.
            for i, (module, duration_ms) in enumerate(DEMO_LOGS):
                sid = DEMO_SESSION_IDS[i % len(DEMO_SESSION_IDS)]
                db.add(UsageLog(session_id=sid, module=module, duration_ms=duration_ms))
            await db.commit()
            print(f"Добавлено демо-логов: {len(DEMO_LOGS)}")
        else:
            print(f"usage_logs уже содержит {count} записей — демо-логи не добавлены")

        print(f"Демо-сессий: {len(DEMO_SESSION_IDS)}")


if __name__ == "__main__":
    asyncio.run(seed())
