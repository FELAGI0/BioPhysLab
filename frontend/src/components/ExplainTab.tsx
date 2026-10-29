/** Вкладка «Объяснения»: тема + уровень, объяснение через explainTopic. */

import { useState } from 'react'
import { explainTopic } from '../api'
import { useAsync } from '../hooks/useAsync'
import { CopyButton } from './CopyButton'
import { ErrorBlock } from './ErrorBlock'
import { MarkdownView } from './MarkdownView'
import { ShareButton } from './ShareButton'
import { Spinner } from './Spinner'

const BUTTON =
  'bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95'

const LEVELS = ['школьник', 'студент', 'врач'] as const

/** Быстрые примеры тем. */
const QUICK_TOPICS = [
  'Потенциал действия кардиомиоцита',
  'Осмос',
  'Диффузия',
]

export function ExplainTab() {
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('студент')

  const { data, error, loading, run } = useAsync(() =>
    explainTopic(topic, level),
  )

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#121a17] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-sm space-y-4 transition-colors duration-200">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 dark:text-emerald-200/70 mb-1">
            Явление или понятие
          </span>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value.slice(0, 200))}
            placeholder="Например: диффузия, потенциал покоя, ультразвук"
            className="block w-full rounded-lg border border-slate-300 dark:border-emerald-900/50 p-2 text-sm
                       bg-white dark:bg-[#0a0f0d] text-slate-900 dark:text-emerald-50 placeholder-slate-400 dark:placeholder-emerald-200/40
                       focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors duration-200"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 dark:text-emerald-200/70 mb-1">
            Уровень слушателя
          </span>
          <select
            value={level}
            onChange={(e) =>
              setLevel(e.target.value as (typeof LEVELS)[number])
            }
            className="block w-full rounded-lg border border-slate-300 dark:border-emerald-900/50 p-2 text-sm
                       bg-white dark:bg-[#0a0f0d] text-slate-900 dark:text-emerald-50
                       focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors duration-200"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        {/* Quick Start: примеры тем по клику */}
        <div className="flex flex-wrap gap-2">
          {QUICK_TOPICS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setTopic(example)}
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
          disabled={topic.trim().length < 2 || loading}
          onClick={run}
        >
          Объяснить
        </button>

        {loading && (
          <Spinner text="Готовим объяснение... (обычно 10–15 секунд)" />
        )}
        {error && <ErrorBlock message={error} />}
      </div>

      {data?.result && (
        <div className="bg-white dark:bg-[#121a17] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-emerald-200/70">
              Объяснение ({level})
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
