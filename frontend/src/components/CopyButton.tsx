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
        className="border border-gray-300 text-gray-600 rounded-lg px-2 py-1 text-xs
                   hover:bg-gray-50 hover:text-gray-800 transition-colors"
      >
        Скопировать ответ
      </button>
      {copied && (
        <span
          role="status"
          className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap
                     bg-gray-900 text-white text-xs rounded px-2 py-1"
        >
          Скопировано!
        </span>
      )}
    </span>
  )
}
