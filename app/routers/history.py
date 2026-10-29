"""Роутер истории запросов: список, очистка, шаринг, PDF-экспорт."""

import io
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from fpdf import FPDF
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_or_create_session
from app.models import ModuleName, Session, UsageLog
from app.models.usage_log import ModuleName as ModuleNameEnum

router = APIRouter(tags=["history"])

# Русские названия модулей (для PDF и ответов API).
MODULE_TITLES = {m.value: m.value for m in ModuleNameEnum}


def _module_title(module: ModuleName) -> str:
    """Русское название модуля."""
    return {
        ModuleName.ecg: "ЭКГ",
        ModuleName.solver: "Задачи",
        ModuleName.explain: "Объяснения",
    }.get(module, module.value)


@router.get("/history")
async def get_history(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    session: Session = Depends(get_or_create_session),
) -> dict:
    """Последние 20 записей текущей сессии, новые сверху."""
    result = await db.execute(
        select(UsageLog)
        .where(UsageLog.session_id == session.id)
        .order_by(UsageLog.created_at.desc())
        .limit(20)
    )
    logs = result.scalars().all()
    return {
        "items": [
            {
                "id": log.id,
                "module": log.module.value,
                "module_title": _module_title(log.module),
                "request_text": log.request_text,
                "response_text": log.response_text,
                "created_at": log.created_at.isoformat() if log.created_at else None,
                "share_token": log.share_token,
            }
            for log in logs
        ]
    }


@router.delete("/history")
async def clear_history(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    session: Session = Depends(get_or_create_session),
) -> dict:
    """Удаляет все записи текущей сессии."""
    await db.execute(delete(UsageLog).where(UsageLog.session_id == session.id))
    await db.commit()
    return {"status": "cleared"}


async def _get_own_log(
    log_id: int, session: Session, db: AsyncSession
) -> UsageLog:
    """Находит запись по id и проверяет, что она принадлежит текущей сессии."""
    log = await db.get(UsageLog, log_id)
    if log is None or log.session_id != session.id:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return log


@router.post("/history/{log_id}/share")
async def share_result(
    log_id: int,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    session: Session = Depends(get_or_create_session),
) -> dict:
    """Генерирует токен шаринга для записи (если ещё нет) и возвращает относительный URL."""
    log = await _get_own_log(log_id, session, db)

    if not log.share_token:
        log.share_token = str(uuid4())
        await db.commit()
        await db.refresh(log)

    return {"url": f"/shared/{log.share_token}"}


@router.get("/shared/{share_token}")
async def get_shared(share_token: str, db: AsyncSession = Depends(get_db)) -> dict:
    """Публичный просмотр записи по токену шаринга (без проверки сессии)."""
    result = await db.execute(
        select(UsageLog).where(UsageLog.share_token == share_token)
    )
    log = result.scalar_one_or_none()
    if log is None:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    return {
        "module": log.module.value,
        "module_title": _module_title(log.module),
        "request_text": log.request_text,
        "response_text": log.response_text,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }


@router.get("/history/{log_id}/pdf")
async def export_pdf(
    log_id: int,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    session: Session = Depends(get_or_create_session),
) -> StreamingResponse:
    """Экспорт записи в PDF (владелец записи — текущая сессия)."""
    log = await _get_own_log(log_id, session, db)

    # fpdf2 со встроенным шрифтом не поддерживает кириллицу;
    # поэтому генерируем PDF через Unicode-шрифт Windows (Arial).
    pdf = FPDF()
    pdf.add_page()

    font_candidates = [
        "C:\\Windows\\Fonts\\arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    ]
    font_loaded = False
    for path in font_candidates:
        try:
            pdf.add_font("UnicodeFont", "", path)
            font_loaded = True
            break
        except Exception:  # noqa: BLE001
            continue
    if font_loaded:
        pdf.set_font("UnicodeFont", size=12)
    else:
        # Fallback: встроенный шрифт (кириллица может отображаться некорректно).
        pdf.set_font("Helvetica", size=12)

    pdf.set_font_size(18)
    pdf.cell(0, 10, "BioPhysLab", ln=True, align="C")
    pdf.set_font_size(10)

    created = (
        log.created_at.strftime("%d.%m.%Y %H:%M") if log.created_at else "—"
    )
    pdf.cell(0, 8, f"Дата: {created}", ln=True)
    pdf.cell(0, 8, f"Модуль: {_module_title(log.module)}", ln=True)
    pdf.ln(4)

    pdf.set_font_size(12)
    pdf.multi_cell(pdf.epw, 8, "Запрос:")
    pdf.set_font_size(10)
    pdf.multi_cell(pdf.epw, 6, log.request_text or "—")
    pdf.ln(4)

    pdf.set_font_size(12)
    pdf.multi_cell(pdf.epw, 8, "Ответ:")
    pdf.set_font_size(10)
    # Переносы строк сохраняются через multi_cell; формулы — как сырой текст.
    pdf.multi_cell(pdf.epw, 6, log.response_text or "—")

    pdf_bytes = bytes(pdf.output())
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="biophyslab_result.pdf"'
        },
    )
