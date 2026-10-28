/**
 * Обёртки над fetch для API BioPhysLab.
 * Все URL относительные ('/api/...') — запросы идут через Vite-прокси на бэкенд.
 */

/** Форма ответа AI-модулей. */
export interface AiResult {
  result: string
}

/** Форма ответа GET /api/stats. */
export interface StatsResponse {
  total_sessions: number
  total_requests: number
  by_module: Record<string, number>
  avg_duration_ms_by_module: Record<string, number>
}

/**
 * Превращает HTTP-ответ с ошибкой в Error с человекочитаемым текстом.
 * Пытается достать detail из JSON-тела FastAPI; если JSON невалидный
 * (например, HTML от Vite-прокси) — текст по коду статуса.
 * response.text() целиком НЕ логируем: там может быть HTML.
 */
async function handleError(response: Response): Promise<never> {
  let message: string | null = null
  try {
    const body = await response.json()
    if (typeof body?.detail === 'string') {
      message = body.detail
    }
  } catch {
    // тело не JSON — остаёмся на сообщении по коду статуса
  }
  throw new Error(message ?? `Ошибка сервера: ${response.status}`)
}

/** POST /api/solver — пошаговое решение задачи по биофизике. */
export async function solveTask(task: string): Promise<AiResult> {
  const response = await fetch('/api/solver', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task }),
  })
  if (!response.ok) {
    await handleError(response)
  }
  return response.json()
}

/** POST /api/explain — объяснение темы под уровень слушателя. */
export async function explainTopic(topic: string, level: string): Promise<AiResult> {
  const response = await fetch('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, level }),
  })
  if (!response.ok) {
    await handleError(response)
  }
  return response.json()
}

/** POST /api/ecg — разбор изображения ЭКГ (multipart, поле 'file'). */
export async function analyzeEcg(file: File): Promise<AiResult> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/ecg', {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    await handleError(response)
  }
  return response.json()
}

/** GET /api/stats — агрегированная статистика использования. */
export async function getStats(): Promise<StatsResponse> {
  const response = await fetch('/api/stats')
  if (!response.ok) {
    await handleError(response)
  }
  return response.json()
}
