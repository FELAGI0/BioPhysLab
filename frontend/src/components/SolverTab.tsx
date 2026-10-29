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
  'bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white rounded-lg px-6 py-3 text-base hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95'

const MAX_TASK_LENGTH = 5000

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
      <div className="bg-white dark:bg-[#16201A] border border-slate-200 dark:border-[#1F2E24] rounded-xl p-4  space-y-4 transition-colors duration-200">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 dark:text-emerald-200/70 mb-1">
            Задача по биофизике
          </span>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value.slice(0, MAX_TASK_LENGTH))}
            placeholder="Например: Рассчитайте потенциал Нернста для K+ при 37°C, если внутриклеточная концентрация 140 ммоль/л, внеклеточная 4 ммоль/л"
            rows={5}
            className="block w-full rounded-lg border border-slate-300 dark:border-[#1F2E24] p-2 text-sm
                       bg-white dark:bg-[#121A15] text-slate-900 dark:text-emerald-50 placeholder-slate-400 dark:placeholder-emerald-200/40
                       focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors duration-200"
          />
          <span
            className={
              'mt-1 block text-right text-xs ' +
              (task.length >= MAX_TASK_LENGTH
                ? 'text-red-600'
                : 'text-slate-400 dark:text-emerald-200/50')
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
              className="text-sm bg-slate-100 hover:bg-slate-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50
                         text-slate-700 dark:text-emerald-200/70 rounded-full px-3 py-1
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

      {data?.result && data.result.startsWith('[OFF_TOPIC]') && (
        <div role="alert" className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 rounded-xl p-4 transition-colors duration-200">
          <p className="text-sm text-amber-800 dark:text-amber-200">{data.result.replace('[OFF_TOPIC]', '').trim()}</p>
        </div>
      )}

      {data?.result && !data.result.startsWith('[OFF_TOPIC]') && (
        <div className="bg-white dark:bg-[#16201A] border border-slate-200 dark:border-[#1F2E24] rounded-xl p-4  transition-colors duration-200">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-emerald-200/70">
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
