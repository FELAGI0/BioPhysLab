/**
 * Обёртки над fetch для API BioPhysLab.
 * Все URL относительные ('/api/...') — запросы идут через Vite-прокси на бэкенд.
 * Если в localStorage есть JWT, он автоматически добавляется в Authorization.
 */

const TOKEN_KEY = 'biophyslab_token'

/** Токен авторизации (JWT) или null. */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/** Сохраняет/удаляет токен в localStorage. */
export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // localStorage недоступен — авторизация просто не сохранится
  }
}

/** Заголовки с Authorization, если есть токен. */
function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken()
  const headers: Record<string, string> = { ...extra }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

/** Форма ответа AI-модулей. */
export interface AiResult {
  result: string
  id?: number
}

/** Форма ответа login/register. */
export interface AuthResponse {
  access_token: string
  token_type: string
}

/** Форма ответа GET /api/auth/me. */
export interface MeResponse {
  email: string
}

/** POST /api/auth/register — регистрация, возвращает JWT. */
export async function register(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    await handleError(response)
  }
  return response.json()
}

/** POST /api/auth/login — вход, возвращает JWT. */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    await handleError(response)
  }
  return response.json()
}

/** GET /api/auth/me — email текущего пользователя по токену. */
export async function getMe(token?: string | null): Promise<MeResponse> {
  const headers: Record<string, string> = {}
  const t = token ?? getToken()
  if (t) headers['Authorization'] = `Bearer ${t}`
  const response = await fetch('/api/auth/me', { headers })
  if (!response.ok) {
    await handleError(response)
  }
  return response.json()
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
    headers: authHeaders({ 'Content-Type': 'application/json' }),
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
    headers: authHeaders({ 'Content-Type': 'application/json' }),
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
    headers: authHeaders(),
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

/** GET /api/history — последние 20 записей (юзера или сессии). */
export async function getHistory(): Promise<HistoryResponse> {
  const response = await fetch('/api/history', { headers: authHeaders() })
  if (!response.ok) {
    await handleError(response)
  }
  return response.json()
}

/** DELETE /api/history — удалить все записи (юзера или сессии). */
export async function clearHistory(): Promise<void> {
  const response = await fetch('/api/history', {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) {
    await handleError(response)
  }
}

/** POST /api/history/{id}/share — получить ссылку для шаринга. */
export async function shareResult(id: number): Promise<{ url: string }> {
  const response = await fetch(`/api/history/${id}/share`, {
    method: 'POST',
    headers: authHeaders(),
  })
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
  const response = await fetch(`/api/history/${id}/pdf`, { headers: authHeaders() })
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

