"""Модель записи использования модуля (для статистики)."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, func, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ModuleName(str, enum.Enum):
    """Имена модулей BioPhysLab. Единый источник значений для колонки module."""

    ecg = "ecg"
    solver = "solver"
    explain = "explain"


class UsageLog(Base):
    """Один вызов AI-модуля: какая сессия, какой модуль, сколько времени занял."""

    __tablename__ = "usage_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(
        ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False
    )
    module: Mapped[ModuleName] = mapped_column(
        Enum(ModuleName, name="modulename"), nullable=False
    )
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    __table_args__ = (
        Index("ix_usage_logs_session_id", "session_id"),
        Index("ix_usage_logs_created_at", "created_at"),
        Index("ix_usage_logs_module", "module"),
    )
