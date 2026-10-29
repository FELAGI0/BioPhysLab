/** Страница публичного просмотра результата по ссылке /shared/{token}. */

import { useEffect, useState } from 'react'
import { getShared, type SharedResponse } from '../api'
import { ErrorBlock } from './ErrorBlock'
import { MarkdownView } from './MarkdownView'
import { Spinner } from './Spinner'

/** Форматирует дату записи. */
function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('ru-RU')
  } catch {
    return iso
  }
}

export function SharedPage({ token }: { token: string }) {
  const [data, setData] = useState<SharedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setData(await getShared(token))
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-4xl mx-auto p-6 w-full flex-1">
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">BioPhysLab</h1>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
              MVP
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Поделившийся результат · ИИ-помощник по биофизике
          </p>
        </header>

        <main>
          {loading && <Spinner text="Загружаем результат..." />}
          {error && <ErrorBlock message={error} />}

          {data && (
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">
                  {data.module_title}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(data.created_at)}
                </span>
              </div>

              <h2 className="text-sm font-semibold text-gray-700 mb-1">Запрос</h2>
              <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">
                {data.request_text ?? '—'}
              </p>

              <h2 className="text-sm font-semibold text-gray-700 mb-2">Ответ</h2>
              <MarkdownView content={data.response_text ?? '—'} />
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-gray-200 bg-white py-4">
        <p className="max-w-4xl mx-auto px-6 text-xs text-gray-400">
          Проект не заменяет консультацию врача. © 2026 BioPhysLab.
        </p>
      </footer>
    </div>
  )
}
