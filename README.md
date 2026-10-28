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
.venv\Scripts\activate        # bash: source .venv/bin/activate
pip install -r requirements.txt

# 3. Настроить конфигурацию
copy .env.example .env        # bash: cp .env.example .env
# заполнить AI_API_KEY (и при необходимости AI_PROVIDER / AI_MODEL)

# 4. Применить миграции
alembic upgrade head

# 5. Заполнить демо-данными (сессии + логи для /api/stats)
#    Windows (PowerShell): $env:PYTHONPATH="."; .venv\Scripts\python scripts\seed_demo.py
#    bash:                  PYTHONPATH=. .venv/Scripts/python scripts/seed_demo.py

# 6. Запустить сервер
uvicorn app.main:app --reload

# 7. Прогнать тесты
.venv\Scripts\python -m pytest tests/ -v
```

Проверка: открыть http://127.0.0.1:8000/health — должно вернуть
`{"status": "ok", "service": "BioPhysLab"}`.

Примечание: PostgreSQL из docker-compose публикуется на порту **5434** хоста
(порт 5432 уже занят локальным PostgreSQL-сервисом). Если на вашей машине 5432
свободен — можно вернуть `"5432:5432"` в docker-compose.yml и поправить
`DATABASE_URL` в `.env`.

## Эндпоинты

| Метод | Путь         | Описание |
|-------|--------------|----------|
| GET   | /health      | Проверка живости сервиса |
| GET   | /api/stats   | Статистика: total_sessions, total_requests, by_module, avg_duration_ms_by_module |
| POST  | /api/ecg     | Разбор изображения ЭКГ (multipart, поле `file`, jpg/png, до 5 МБ) |
| POST  | /api/solver  | Пошаговое решение задачи (JSON: `{"task": "..."}`, 5–2000 символов) |
| POST  | /api/explain | Объяснение явления (JSON: `{"topic": "...", "level": "школьник\\|студент\\|врач"}`) |

Все AI-эндпоинты возвращают `{"result": "..."}`; на запрос тратится rate-limit
(30 запросов/час на cookie-сессию, 429 при превышении).

## Как получить ключ AI

**Gemini (бесплатно):**
1. Открыть https://aistudio.google.com/app/apikey
2. Нажать «Create API key» и скопировать ключ
3. Вставить в `.env`: `AI_API_KEY=...`, `AI_PROVIDER=gemini`, `AI_MODEL=gemini-1.5-flash`

**OpenAI:**
1. Открыть https://platform.openai.com/api-keys
2. Нажать «Create new secret key» и скопировать ключ
3. Вставить в `.env`: `AI_API_KEY=...`, `AI_PROVIDER=openai`, `AI_MODEL=gpt-4o-mini`

## Ограничения

- Проект учебный: **не заменяет консультацию врача**. Разбор ЭКГ —
  предварительный, для образовательных целей.
- ИИ может ошибаться в решениях задач и интерпретации ЭКГ —
  проверяйте ответы по учебнику.
- Анонимные cookie-сессии — только для статистики, личных данных нет.

## Сценарий демо

1. **Задача с известным ответом:** POST /api/solver с задачей
   «Конденсатор 10 мкФ заряжен до 100 В. Найти энергию.» — сверить ответ
   с ручным решением (W = CU²/2 = 50 мДж).
2. **ЭКГ:** POST /api/ecg с картинкой ЭКГ — показать структурированный разбор.
3. **Объяснение:** POST /api/explain `{"topic": "диффузия", "level": "студент"}` —
   затем тот же topic с level «школьник», показать разницу подачки.
4. **Кейс отказа:** остановить сеть или задать неверный AI_API_KEY — показать
   аккуратный 502 вместо падения сервера.
5. **Статистика:** GET /api/stats — показать накопленные цифры после запросов.

## Перед коммитом

Чек-лист: `git diff --cached | grep -i "AI_API_KEY\|SECRET_KEY"` —
**не должно быть совпадений** (плейсхолдеры в .env.example не в счёт).
