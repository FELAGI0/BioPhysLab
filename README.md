# BioPhysLab

Учебный мультитул по биофизике для студентов-медиков: разбор ЭКГ (картинка),
пошаговое решение задач (текст) и объяснение явлений под выбранный уровень.
Бэкенд — FastAPI + PostgreSQL, AI через серверный прокси (ключ не отдаётся в браузер).

## Быстрый старт

```bash
# 1. Поднять PostgreSQL
docker compose up -d

# 2. Создать виртуальное окружение и установить зависимости
py -m venv .venv
.venv\Scripts\activate        # Windows (bash: source .venv/bin/activate)
pip install -r requirements.txt

# 3. Настроить конфигурацию
copy .env.example .env        # bash: cp .env.example .env
# заполнить AI_API_KEY (и при необходимости AI_PROVIDER / AI_MODEL)

# 4. Применить миграции
alembic upgrade head

# 5. Запустить сервер
uvicorn app.main:app --reload
```

Проверка: открыть http://127.0.0.1:8000/health — должно вернуть
`{"status": "ok", "service": "BioPhysLab"}`.

Примечание: PostgreSQL из docker-compose публикуется на порту **5434** хоста
(порт 5432 уже занят локальным PostgreSQL-сервисом). Если на вашей машине 5432
свободен — можно вернуть `"5432:5432"` в docker-compose.yml и поправить
`DATABASE_URL` в `.env`.

## Как получить ключ AI

**Gemini (бесплатно):**
1. Открыть https://aistudio.google.com/app/apikey
2. Нажать «Create API key» и скопировать ключ
3. Вставить в `.env`: `AI_API_KEY=...`, `AI_PROVIDER=gemini`, `AI_MODEL=gemini-1.5-flash`

**OpenAI:**
1. Открыть https://platform.openai.com/api-keys
2. Нажать «Create new secret key» и скопировать ключ
3. Вставить в `.env`: `AI_API_KEY=...`, `AI_PROVIDER=openai`, `AI_MODEL=gpt-4o-mini`
