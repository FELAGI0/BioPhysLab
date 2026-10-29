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
  'bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95'

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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm space-y-4 transition-colors duration-200">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Явление или понятие
          </span>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value.slice(0, 200))}
            placeholder="Например: диффузия, потенциал покоя, ультразвук"
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Уровень слушателя
          </span>
          <select
            value={level}
            onChange={(e) =>
              setLevel(e.target.value as (typeof LEVELS)[number])
            }
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
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
              className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                         text-gray-700 dark:text-gray-300 rounded-full px-3 py-1
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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
