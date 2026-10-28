"""Сервис статистики: агрегаты по сессиям и логам использования."""

from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ModuleName, Session, UsageLog


async def get_stats(db: AsyncSession) -> dict:
    """Собирает агрегированную статистику использования BioPhysLab.

    Возвращает: total_sessions, total_requests, by_module,
    avg_duration_ms_by_module.
    """
    total_sessions = await db.scalar(select(func.count()).select_from(Session))
    total_requests = await db.scalar(select(func.count()).select_from(UsageLog))

    by_module_rows = await db.execute(
        select(UsageLog.module, func.count())
        .group_by(UsageLog.module)
        .order_by(UsageLog.module)
    )
    by_module = {row[0].value: row[1] for row in by_module_rows}

    avg_rows = await db.execute(
        select(
            UsageLog.module,
            func.avg(UsageLog.duration_ms),
        )
        .where(UsageLog.duration_ms.is_not(None))
        .group_by(UsageLog.module)
        .order_by(UsageLog.module)
    )
    avg_duration_ms_by_module = {
        row[0].value: round(row[1]) for row in avg_rows if row[1] is not None
    }

    return {
        "total_sessions": total_sessions or 0,
        "total_requests": total_requests or 0,
        "by_module": by_module,
        "avg_duration_ms_by_module": avg_duration_ms_by_module,
    }
