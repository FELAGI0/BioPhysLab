/** Универсальное модальное окно (без роутера, просто стейт родителя). */

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  const [visible, setVisible] = useState(false)

  // Плавное появление: сначала рендерим со scale-95/прозрачным фоном,
  // затем кадром позже переключаем на scale-100/затемнённый фон.
  useEffect(() => {
    const timer = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(timer)
  }, [])

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
      className={
        'fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ' +
        (visible ? 'bg-black/50 opacity-100' : 'bg-black/0 opacity-0')
      }
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-lg ' +
          'max-w-lg w-full max-h-[80vh] overflow-y-auto transition-transform duration-200 ' +
          (visible ? 'scale-100' : 'scale-95')
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно"
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300
                       text-xl leading-none transition-all duration-200 active:scale-95"
          >
            ×
          </button>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
        <div className="mt-6 text-right">
          <button
            type="button"
            onClick={onClose}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700
                       transition-all duration-200 active:scale-95"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
