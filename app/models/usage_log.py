"""Модель записи использования модуля (для статистики и истории)."""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ModuleName(str, enum.Enum):
    """Имена модулей BioPhysLab. Единый источник значений для колонки module."""

    ecg = "ecg"
    solver = "solver"
    explain = "explain"


class UsageLog(Base):
    """Один вызов AI-модуля: сессия, модуль, тексты запроса/ответа, время."""

    __tablename__ = "usage_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(
        ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False
    )
    # Привязка к пользователю (SET NULL: при удалении юзера история остаётся).
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    module: Mapped[ModuleName] = mapped_column(
        Enum(ModuleName, name="modulename"), nullable=False
    )
    # Тексты запроса и ответа — для истории и шаринга (nullable для старых записей).
    request_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    response_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Токен шаринга: uuid4, проставляется при первом запросе ссылки.
    share_token: Mapped[str | None] = mapped_column(
        String(36), unique=True, nullable=True, index=True
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
