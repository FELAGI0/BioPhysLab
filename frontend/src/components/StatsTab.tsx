/** Вкладка «Статистика»: агрегаты по сессиям и модулям через getStats. */

import { useEffect } from 'react'
import { getStats } from '../api'
import { useAsync } from '../hooks/useAsync'
import { ErrorBlock } from './ErrorBlock'
import { Spinner } from './Spinner'

const BUTTON =
  'bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

const MODULE_LABELS: Record<string, string> = {
  ecg: 'ЭКГ',
  solver: 'Задачи',
  explain: 'Объяснения',
}

function moduleLabel(key: string): string {
  return MODULE_LABELS[key] ?? key
}

export function StatsTab() {
  const { data, error, loading, run } = useAsync(getStats)

  // Загружаем статистику при монтировании.
  useEffect(() => {
    void run()
  }, [run])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-blue-600">
            {data?.total_sessions ?? '—'}
          </div>
          <div className="mt-1 text-xs text-gray-500">Всего сессий</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-blue-600">
            {data?.total_requests ?? '—'}
          </div>
          <div className="mt-1 text-xs text-gray-500">Всего запросов</div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-blue-600">
            {data ? Object.keys(data.by_module).length : '—'}
          </div>
          <div className="mt-1 text-xs text-gray-500">Модулей</div>
        </div>
      </div>

      {loading && <Spinner text="Загружаем статистику..." />}
      {error && <ErrorBlock message={error} />}

      {data && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              Запросы по модулям
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(data.by_module).map(([key, count]) => (
                  <tr key={key} className="border-b border-gray-100 last:border-0">
                    <td className="py-1.5 text-gray-600">{moduleLabel(key)}</td>
                    <td className="py-1.5 text-right font-medium text-gray-800">
                      {count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              Среднее время ответа
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(data.avg_duration_ms_by_module).map(
                  ([key, ms]) => (
                    <tr
                      key={key}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="py-1.5 text-gray-600">
                        {moduleLabel(key)}
                      </td>
                      <td className="py-1.5 text-right font-medium text-gray-800">
                        {ms} мс
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button type="button" className={BUTTON} disabled={loading} onClick={run}>
        Обновить
      </button>
    </div>
  )
}
