/** Универсальное модальное окно (без роутера, просто стейт родителя). */

import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  // Закрытие по Escape.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="bg-white border rounded-xl p-6 shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно"
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="text-sm text-gray-700">{children}</div>
        <div className="mt-6 text-right">
          <button
            type="button"
            onClick={onClose}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
