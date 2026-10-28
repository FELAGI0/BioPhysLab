/** Вкладка «Задачи»: условие задачи, пошаговое решение через solveTask. */

import { useState } from 'react'
import { solveTask } from '../api'
import { useAsync } from '../hooks/useAsync'
import { ErrorBlock } from './ErrorBlock'
import { MarkdownView } from './MarkdownView'
import { Spinner } from './Spinner'

const BUTTON =
  'bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

const MAX_TASK_LENGTH = 2000

export function SolverTab() {
  const [task, setTask] = useState('')

  const { data, error, loading, run } = useAsync(() => solveTask(task))

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Задача по биофизике
          </span>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value.slice(0, MAX_TASK_LENGTH))}
            placeholder="Например: Рассчитайте потенциал Нернста для K+ при 37°C, если внутриклеточная концентрация 140 ммоль/л, внеклеточная 4 ммоль/л"
            rows={5}
            className="block w-full rounded-lg border border-gray-300 p-2 text-sm
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span
            className={
              'mt-1 block text-right text-xs ' +
              (task.length >= MAX_TASK_LENGTH ? 'text-red-600' : 'text-gray-400')
            }
          >
            {task.length} / {MAX_TASK_LENGTH}
          </span>
        </label>

        <button
          type="button"
          className={BUTTON}
          disabled={task.trim().length < 5 || loading}
          onClick={run}
        >
          Решить
        </button>

        {loading && <Spinner text="Решаем задачу... (обычно 5–10 секунд)" />}
        {error && <ErrorBlock message={error} />}
      </div>

      {data?.result && (
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Пошаговое решение
          </h3>
          <MarkdownView content={data.result} />
        </div>
      )}
    </div>
  )
}
