/**
 * Обёртки над fetch для API BioPhysLab.
 * Все URL относительные ('/api/...') — запросы идут через Vite-прокси на бэкенд.
 */

/** Форма ответа AI-модулей. */
export interface AiResult {
  result: string
  id?: number
}

/** Форма ответа GET /api/stats. */
export interface StatsResponse {
  total_sessions: number
  total_requests: number
  by_module: Record<string, number>
  avg_duration_ms_by_module: Record<string, number>
}

/** Один элемент истории. */
export interface HistoryItem {
  id: number
  module: string
  module_title: string
  request_text: string | null
  response_text: string | null
  created_at: string | null
  share_token: string | null
}

/** Форма ответа GET /api/history. */
export interface HistoryResponse {
  items: HistoryItem[]
}

/** Форма ответа GET /api/shared/{token}. */
export interface SharedResponse {
  module: string
  module_title: string
  request_text: string | null
  response_text: string | null
  created_at: string | null
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

/** GET /api/history — последние 20 записей текущей сессии. */
export async function getHistory(): Promise<HistoryResponse> {
  const response = await fetch('/api/history')
  if (!response.ok) {
    await handleError(response)
  }
  return response.json()
}

/** DELETE /api/history — удалить все записи текущей сессии. */
export async function clearHistory(): Promise<void> {
  const response = await fetch('/api/history', { method: 'DELETE' })
  if (!response.ok) {
    await handleError(response)
  }
}

/** POST /api/history/{id}/share — получить ссылку для шаринга. */
export async function shareResult(id: number): Promise<{ url: string }> {
  const response = await fetch(`/api/history/${id}/share`, { method: 'POST' })
  if (!response.ok) {
    await handleError(response)
  }
  return response.json()
}

/** GET /api/shared/{token} — публичный просмотр записи по токену. */
export async function getShared(token: string): Promise<SharedResponse> {
  const response = await fetch(`/api/shared/${token}`)
  if (!response.ok) {
    await handleError(response)
  }
  return response.json()
}

/** GET /api/history/{id}/pdf — скачать PDF с результатом (blob + временная ссылка). */
export async function downloadPdf(id: number): Promise<void> {
  const response = await fetch(`/api/history/${id}/pdf`)
  if (!response.ok) {
    await handleError(response)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'biophyslab_result.pdf'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

