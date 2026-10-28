"""Смоук-тесты BioPhysLab: health, три модуля с моком ask_ai, пустой ответ AI, rate limit.

База данных и сессии полностью замоканы через app.dependency_overrides —
тесты не требуют PostgreSQL.
"""

import base64
from collections.abc import AsyncGenerator
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from fastapi import Request, Response
from httpx import ASGITransport, AsyncClient

import app.routers.ecg as ecg_mod
import app.routers.explain as explain_mod
import app.routers.solver as solver_mod
import app.services.ai_client as ai_mod
from app.db import get_db
from app.deps import _RATE_LIMIT_STORE, get_or_create_session
from app.main import app


class FakeDB:
    """Заглушка AsyncSession: все методы — no-op."""

    async def execute(self, query):  # noqa: ANN001
        return SimpleNamespace(scalar_one_or_none=lambda: None)

    async def scalar(self, query):  # noqa: ANN001
        return 0

    async def commit(self) -> None:
        pass

    async def refresh(self, obj) -> None:  # noqa: ANN001
        pass

    async def add(self, obj) -> None:  # noqa: ANN001
        pass


async def fake_get_db() -> AsyncGenerator[FakeDB, None]:
    """Замок get_db — вместо реальной БД отдаём FakeDB."""
    yield FakeDB()


async def stub_session(request: Request, response: Response) -> SimpleNamespace:
    """Замок get_or_create_session: всегда одна и та же тестовая сессия."""
    return SimpleNamespace(id="test-session-id")


@pytest.fixture
async def client():
    """HTTP-клиент с замоканными БД и сессией; rate-limit хранилище чистится."""
    _RATE_LIMIT_STORE.clear()
    app.dependency_overrides[get_db] = fake_get_db
    app.dependency_overrides[get_or_create_session] = stub_session
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            yield c
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_or_create_session, None)


@pytest.mark.asyncio
async def test_health(client):
    """/health отвечает 200 и status=ok."""
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_ecg_mock(client):
    """POST /api/ecg с картинкой при мокнутом ask_ai → 200 и result."""
    image_bytes = b"fake-jpeg-bytes"
    fake_ai = _make_fake_ai("Анализ ЭКГ: ритм синусовый, 70 уд/мин.")

    with patch.object(ecg_mod, "ask_ai", fake_ai):
        files = {
            "file": (
                "ecg.jpg",
                base64.b64decode(base64.b64encode(image_bytes)),
                "image/jpeg",
            )
        }
        resp = await client.post("/api/ecg", files=files)

    assert resp.status_code == 200
    assert resp.json() == {"result": "Анализ ЭКГ: ритм синусовый, 70 уд/мин."}


@pytest.mark.asyncio
async def test_solver_mock(client):
    """POST /api/solver при мокнутом ask_ai → 200 и result."""
    fake_ai = _make_fake_ai("Дано: ... Решение: ... Ответ: 50 мДж.")

    with patch.object(solver_mod, "ask_ai", fake_ai):
        resp = await client.post(
            "/api/solver", json={"task": "Найти энергию конденсатора 10 мкФ при 100 В"}
        )

    assert resp.status_code == 200
    assert "Ответ" in resp.json()["result"]


@pytest.mark.asyncio
async def test_explain_mock(client):
    """POST /api/explain при мокнутом ask_ai → 200 и result."""
    fake_ai = _make_fake_ai("Диффузия — это перемещение молекул из области...")

    with patch.object(explain_mod, "ask_ai", fake_ai):
        resp = await client.post(
            "/api/explain", json={"topic": "диффузия", "level": "студент"}
        )

    assert resp.status_code == 200
    assert "перемещение" in resp.json()["result"]


@pytest.mark.asyncio
async def test_empty_ai_response(client):
    """Провайдер вернул пустой текст → ask_ai даёт 502."""
    async def fake_provider(prompt: str, image_b64: str | None) -> str | None:
        return "   "  # пустой/whitespace ответ провайдера

    with patch.object(ai_mod, "_ask_gemini", fake_provider):
        resp = await client.post("/api/solver", json={"task": "Задача про осмос"})

    assert resp.status_code == 502
    assert resp.json()["detail"] == "AI вернул пустой ответ"


@pytest.mark.asyncio
async def test_rate_limit(client):
    """RATE_LIMIT_PER_HOUR=2: третий запрос той же сессии → 429."""
    from app.config import settings

    fake_ai = _make_fake_ai("ок")

    with patch.object(settings, "RATE_LIMIT_PER_HOUR", 2), \
         patch.object(solver_mod, "ask_ai", fake_ai):
        _RATE_LIMIT_STORE.clear()
        resp1 = await client.post("/api/solver", json={"task": "Задача один"})
        resp2 = await client.post("/api/solver", json={"task": "Задача два"})
        resp3 = await client.post("/api/solver", json={"task": "Задача три"})

    assert resp1.status_code == 200
    assert resp2.status_code == 200
    assert resp3.status_code == 429
    assert resp3.json()["detail"] == "Слишком много запросов. Попробуйте позже."


def _make_fake_ai(answer: str):
    """Фабрика мока ask_ai с заданным ответом."""

    async def fake_ai(prompt: str, image_b64: str | None = None, module: str = "unknown") -> str:
        return answer

    return fake_ai
