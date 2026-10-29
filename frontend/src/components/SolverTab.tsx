/** Вкладка «Задачи»: условие задачи, пошаговое решение через solveTask. */

import { useState } from 'react'
import { solveTask } from '../api'
import { useAsync } from '../hooks/useAsync'
import { CopyButton } from './CopyButton'
import { ErrorBlock } from './ErrorBlock'
import { MarkdownView } from './MarkdownView'
import { ShareButton } from './ShareButton'
import { Spinner } from './Spinner'

const BUTTON =
  'bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95'

const MAX_TASK_LENGTH = 2000

/** Быстрые примеры задач для новичка. */
const QUICK_TASKS = [
  'Потенциал Нернста для K+',
  'Потенциал меди',
  'Осмос',
]

export function SolverTab() {
  const [task, setTask] = useState('')

  const { data, error, loading, run } = useAsync(() => solveTask(task))

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-4 transition-colors duration-200">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Задача по биофизике
          </span>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value.slice(0, MAX_TASK_LENGTH))}
            placeholder="Например: Рассчитайте потенциал Нернста для K+ при 37°C, если внутриклеточная концентрация 140 ммоль/л, внеклеточная 4 ммоль/л"
            rows={5}
            className="block w-full rounded-lg border border-gray-300 dark:border-slate-600 p-2 text-sm
                       bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
          />
          <span
            className={
              'mt-1 block text-right text-xs ' +
              (task.length >= MAX_TASK_LENGTH
                ? 'text-red-600'
                : 'text-gray-400 dark:text-slate-500')
            }
          >
            {task.length} / {MAX_TASK_LENGTH}
          </span>
        </label>

        {/* Quick Start: примеры задач по клику */}
        <div className="flex flex-wrap gap-2">
          {QUICK_TASKS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setTask(example)}
              className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600
                         text-gray-700 dark:text-slate-300 rounded-full px-3 py-1
                         transition-colors duration-200 active:scale-95"
            >
              {example}
            </button>
          ))}
        </div>

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
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              Пошаговое решение
            </h3>
            <div className="flex gap-2">
              <CopyButton content={data.result} />
              {data.id != null && <ShareButton id={data.id} />}
            </div>
          </div>
          <MarkdownView content={data.result} />
        </div>
      )}
    </div>
  )
}
