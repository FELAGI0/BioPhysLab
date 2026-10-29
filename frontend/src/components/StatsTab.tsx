/** Вкладка «Статистика»: агрегаты по сессиям и модулям через getStats. */

import { useEffect } from 'react'
import { getStats } from '../api'
import { useAsync } from '../hooks/useAsync'
import { ErrorBlock } from './ErrorBlock'
import { Spinner } from './Spinner'
import { StatsSkeleton } from './Skeleton'

const BUTTON =
  'bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95'

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
      {/* Skeleton при первой загрузке — вместо резкого появления цифр. */}
      {loading && !data && <StatsSkeleton />}
      {loading && data && <Spinner text="Загружаем статистику..." />}
      {error && <ErrorBlock message={error} />}

      {!loading && !data && !error && (
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Нет данных — нажмите «Обновить».
        </p>
      )}

      {data && (
        <div key={loading ? 'loading' : 'ready'} className="space-y-4 animate-fadeIn">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm text-center transition-colors duration-200">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {data?.total_sessions ?? '—'}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">Всего сессий</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm text-center transition-colors duration-200">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {data?.total_requests ?? '—'}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">Всего запросов</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm text-center transition-colors duration-200">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {data ? Object.keys(data.by_module).length : '—'}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">Модулей</div>
        </div>
      </div>

      {data && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm transition-colors duration-200">
            <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
              Запросы по модулям
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(data.by_module).map(([key, count]) => (
                  <tr key={key} className="border-b border-gray-100 dark:border-slate-700 last:border-0">
                    <td className="py-1.5 text-gray-600 dark:text-slate-400">{moduleLabel(key)}</td>
                    <td className="py-1.5 text-right font-medium text-gray-800 dark:text-slate-200">
                      {count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm transition-colors duration-200">
            <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
              Среднее время ответа
            </h3>
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(data.avg_duration_ms_by_module).map(
                  ([key, ms]) => (
                    <tr
                      key={key}
                      className="border-b border-gray-100 dark:border-slate-700 last:border-0"
                    >
                      <td className="py-1.5 text-gray-600 dark:text-slate-400">
                        {moduleLabel(key)}
                      </td>
                      <td className="py-1.5 text-right font-medium text-gray-800 dark:text-slate-200">
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

      {data && Object.keys(data.avg_duration_ms_by_module).length > 0 && (
        <p className="text-xs text-gray-400 dark:text-slate-500">
          Среднее время: ЭКГ {data.avg_duration_ms_by_module['ecg'] ?? '—'} мс,
          Задачи {data.avg_duration_ms_by_module['solver'] ?? '—'} мс,
          Объяснения {data.avg_duration_ms_by_module['explain'] ?? '—'} мс
        </p>
      )}
        </div>
      )}

      <button type="button" className={BUTTON} disabled={loading} onClick={run}>
        Обновить
      </button>
    </div>
  )
}
