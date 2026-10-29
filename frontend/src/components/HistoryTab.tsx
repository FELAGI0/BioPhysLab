/** Вкладка «История»: последние запросы сессии, шаринг, PDF, очистка. */

import { useEffect, useState } from 'react'
import {
  clearHistory,
  downloadPdf,
  getHistory,
  shareResult,
  type HistoryItem,
} from '../api'
import { ErrorBlock } from './ErrorBlock'
import { MarkdownView } from './MarkdownView'
import { Spinner } from './Spinner'

const BUTTON =
  'bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95'

const SMALL_BUTTON =
  'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 transition-all duration-200 active:scale-95'

/** Обрезает длинный текст запроса для карточки истории. */
function truncate(text: string | null, max = 120): string {
  if (!text) return '—'
  return text.length > max ? text.slice(0, max) + '…' : text
}

/** Форматирует дату записи. */
function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('ru-RU')
  } catch {
    return iso
  }
}

export function HistoryTab() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [copiedShareId, setCopiedShareId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getHistory()
      setItems(data.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  // Загружаем историю при монтировании.
  useEffect(() => {
    void load()
  }, [])

  const onClear = async () => {
    if (!window.confirm('Удалить все записи истории этой сессии?')) return
    try {
      await clearHistory()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const onShare = async (id: number) => {
    try {
      const { url } = await shareResult(id)
      await navigator.clipboard.writeText(window.location.origin + url)
      setCopiedShareId(id)
      setTimeout(() => setCopiedShareId(null), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const onPdf = async (id: number) => {
    try {
      await downloadPdf(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Последние 20 запросов этой сессии
        </p>
        <div className="flex gap-2">
          <button type="button" className={BUTTON} disabled={loading} onClick={load}>
            Обновить
          </button>
          <button
            type="button"
            className={SMALL_BUTTON}
            disabled={loading || items.length === 0}
            onClick={onClear}
          >
            Очистить историю
          </button>
        </div>
      </div>

      {loading && <Spinner text="Загружаем историю..." />}
      {error && <ErrorBlock message={error} />}

      {items.length === 0 && !loading && !error && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm text-sm text-gray-500 dark:text-gray-400 text-center transition-colors duration-200">
          История пуста — сделайте запрос во вкладках «ЭКГ», «Задачи»
          или «Объяснения».
        </div>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                     rounded-xl p-4 shadow-sm hover:shadow-md
                     transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded">
                {item.module_title}
              </span>
              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                {formatDate(item.created_at)}
              </span>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 break-words">
                {truncate(item.request_text)}
              </p>
            </div>
          </div>

          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              type="button"
              className={SMALL_BUTTON}
              onClick={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
            >
              {expandedId === item.id ? 'Скрыть ответ' : 'Показать ответ'}
            </button>
            <button
              type="button"
              className={SMALL_BUTTON}
              onClick={() => onShare(item.id)}
            >
              {copiedShareId === item.id ? 'Ссылка скопирована!' : 'Поделиться'}
            </button>
            <button
              type="button"
              className={SMALL_BUTTON}
              onClick={() => onPdf(item.id)}
            >
              Скачать PDF
            </button>
          </div>

          {expandedId === item.id && item.response_text && (
            <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
              <MarkdownView content={item.response_text} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
