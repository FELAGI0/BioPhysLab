/** Кнопка «Поделиться»: получает ссылку и копирует её в буфер обмена. */

import { useEffect, useState } from 'react'
import { shareResult } from '../api'

export function ShareButton({ id }: { id: number }) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Скрываем подсказку через 2 секунды.
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const onShare = async () => {
    setError(null)
    try {
      const { url } = await shareResult(id)
      await navigator.clipboard.writeText(window.location.origin + url)
      setCopied(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={onShare}
        className="border border-slate-300 dark:border-emerald-900/50 text-slate-600 dark:text-emerald-200/70 rounded-lg px-2 py-1 text-xs
                   hover:bg-slate-50 dark:hover:bg-emerald-900/40 hover:text-slate-800 dark:hover:text-emerald-100
                   transition-all duration-200 active:scale-95"
      >
        {copied ? 'Ссылка скопирована!' : 'Поделиться'}
      </button>
      {copied && (
        <span
          role="status"
          className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap
                     bg-slate-900 dark:bg-emerald-900/60 text-white text-xs rounded px-2 py-1"
        >
          Скопировано!
        </span>
      )}
      {error && (
        <span
          role="alert"
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap
                     text-red-600 text-xs"
        >
          {error}
        </span>
      )}
    </span>
  )
}
