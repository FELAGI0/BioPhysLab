/** Вкладка «Объяснения»: тема + уровень, объяснение через explainTopic. */

import { useState } from 'react'
import { explainTopic } from '../api'
import { useAsync } from '../hooks/useAsync'
import { ErrorBlock } from './ErrorBlock'
import { Spinner } from './Spinner'

const BUTTON =
  'bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

const LEVELS = ['школьник', 'студент', 'врач'] as const

export function ExplainTab() {
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('студент')

  const { data, error, loading, run } = useAsync(() =>
    explainTopic(topic, level),
  )

  return (
    <div className="space-y-4">
      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Явление или понятие
          </span>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value.slice(0, 200))}
            placeholder="Например: диффузия, потенциал покоя, ультразвук"
            className="block w-full rounded-lg border border-gray-300 p-2 text-sm
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Уровень слушателя
          </span>
          <select
            value={level}
            onChange={(e) =>
              setLevel(e.target.value as (typeof LEVELS)[number])
            }
            className="block w-full rounded-lg border border-gray-300 p-2 text-sm
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={BUTTON}
          disabled={topic.trim().length < 2 || loading}
          onClick={run}
        >
          Объяснить
        </button>

        {loading && <Spinner text="Объясняем..." />}
        {error && <ErrorBlock message={error} />}
      </div>

      {data?.result && (
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Объяснение ({level})
          </h3>
          <pre className="whitespace-pre-wrap text-sm text-gray-700">
            {data.result}
          </pre>
        </div>
      )}
    </div>
  )
}
