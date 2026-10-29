/** Кнопка «Скопировать ответ»: копирует сырой текст в буфер обмена. */

import { useEffect, useState } from 'react'

export function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  // Скрываем подсказку «Скопировано!» через 2 секунды.
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
    } catch {
      // Буфер обмена недоступен (например, HTTP без HTTPS) — просто молча игнорируем.
    }
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={onCopy}
        className="border border-slate-300 dark:border-[#1F2E24] text-slate-600 dark:text-emerald-200/70 rounded-lg px-2 py-1 text-xs
                   hover:bg-slate-50 dark:hover:bg-emerald-900/40 hover:text-slate-800 dark:hover:text-emerald-100
                   transition-all duration-200 active:scale-95"
      >
        Скопировать ответ
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
    </span>
  )
}
