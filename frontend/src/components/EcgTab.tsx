/** Вкладка «ЭКГ»: hero-лендинг, drag&drop загрузка, разбор, последние анализы. */

import { useEffect, useRef, useState } from 'react'
import { analyzeEcg, getHistory, type HistoryItem } from '../api'
import { useAsync } from '../hooks/useAsync'
import { CopyButton } from './CopyButton'
import { ErrorBlock } from './ErrorBlock'
import {
  IconDoctor,
  IconEcg,
  IconExplain,
  IconHistory,
  IconUpload,
} from './icons'
import { MarkdownView } from './MarkdownView'
import { ShareButton } from './ShareButton'
import { Spinner } from './Spinner'

const BUTTON =
  'bg-emerald-600 dark:bg-emerald-500 dark:text-black font-medium text-white rounded-lg px-4 py-2 hover:bg-emerald-700 dark:hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95'

const DRAG_OVER =
  'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('ru-RU')
  } catch {
    return iso
  }
}

export function EcgTab() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [recent, setRecent] = useState<HistoryItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Освобождаем URL превью при смене файла и при размонтировании.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  // Последние анализы (для hero-режима): первые 3 записи истории.
  useEffect(() => {
    getHistory()
      .then((data) => setRecent(data.items.slice(0, 3)))
      .catch(() => {
        // история недоступна (например, бэкенд не запущен) — просто скрываем блок
      })
  }, [])

  const { data, error, loading, run } = useAsync(() =>
    file ? analyzeEcg(file) : Promise.reject(new Error('Файл не выбран')),
  )

  const acceptFile = (selected: File | null) => {
    if (
      selected &&
      !['image/png', 'image/jpeg', 'image/jpg'].includes(selected.type)
    ) {
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(selected)
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0] ?? null)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    acceptFile(e.dataTransfer.files?.[0] ?? null)
  }

  // ===== Рабочая область (файл выбран или результат есть) =====
  if (file || data?.result) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#121a17] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-sm space-y-4 transition-colors duration-200">
          {/* Зона загрузки (drag & drop) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
            }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={
              'flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer ' +
              'border-2 border-dashed border-slate-300 dark:border-emerald-900/50 transition-colors duration-200 ' +
              (dragActive ? DRAG_OVER : 'hover:border-emerald-400 dark:hover:border-emerald-700')
            }
          >
            <IconUpload size={28} className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-slate-700 dark:text-emerald-200/70">
              Загрузите изображение ЭКГ
            </p>
            <p className="text-xs text-slate-400 dark:text-emerald-200/50">
              PNG / JPG до 5 МБ — или перетащите файл сюда
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={onFileChange}
              className="hidden"
            />
          </div>

          {previewUrl && (
            <div className="space-y-3">
              <img
                src={previewUrl}
                alt="Предпросмотр ЭКГ"
                className="max-h-64 rounded-lg border border-slate-200 dark:border-emerald-900/50"
              />
              <button
                type="button"
                className={BUTTON + ' inline-flex items-center gap-2 px-6 py-2.5'}
                disabled={!file || loading}
                onClick={run}
              >
                <IconDoctor size={16} />
                {loading ? 'Анализируем...' : 'Проанализировать'}
              </button>
            </div>
          )}

          {loading && (
            <Spinner text="Анализируем ЭКГ... (обычно 10–15 секунд)" />
          )}
          {error && <ErrorBlock message={error} />}
        </div>

        {data?.result && (
          <div className="bg-white dark:bg-[#121a17] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-sm transition-colors duration-200">
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-emerald-200/70">
                Результат разбора
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

  // ===== Hero-лендинг (файла и результата нет) =====
  return (
    <div className="space-y-8">
      <section className="text-center space-y-4 pt-4">
        <h2 className="text-[34px] leading-tight font-bold text-slate-900 dark:text-emerald-50">
          ИИ-анализ электрокардиограмм
        </h2>
        <p className="text-base text-slate-500 dark:text-emerald-200/60">
          BioPhysLab разбирает снимки ЭКГ и объясняет каждый вывод —
          как врач-биофизик, только быстрее.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2">
          <div className="bg-white dark:bg-[#121a17] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-sm transition-colors duration-200">
            <IconEcg size={24} className="mx-auto text-emerald-600 dark:text-emerald-400" />
            <p className="mt-2 text-sm text-slate-700 dark:text-emerald-200/70">
              Анализ за 5–10 секунд
            </p>
          </div>
          <div className="bg-white dark:bg-[#121a17] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-sm transition-colors duration-200">
            <IconExplain size={24} className="mx-auto text-emerald-600 dark:text-emerald-400" />
            <p className="mt-2 text-sm text-slate-700 dark:text-emerald-200/70">
              Объяснение каждого вывода
            </p>
          </div>
          <div className="bg-white dark:bg-[#121a17] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-sm transition-colors duration-200">
            <IconHistory size={24} className="mx-auto text-emerald-600 dark:text-emerald-400" />
            <p className="mt-2 text-sm text-slate-700 dark:text-emerald-200/70">
              История исследований
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={
            BUTTON +
            ' inline-flex items-center gap-2 px-6 py-3 text-base mx-auto mt-2'
          }
        >
          <IconUpload size={18} />
          Загрузить ЭКГ
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={onFileChange}
          className="hidden"
        />
      </section>

      {recent.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-emerald-200/70">
            Последние исследования
          </h3>
          <div className="grid gap-3">
            {recent.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-[#121a17] border border-slate-200 dark:border-emerald-900/50
                           rounded-xl p-3 shadow-sm flex items-center gap-3
                           hover:shadow-md transition-all duration-200"
              >
                <span className="shrink-0 text-emerald-600 dark:text-emerald-400">
                  <IconEcg size={20} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 dark:text-emerald-200/70 truncate">
                    {item.request_text ?? 'Изображение ЭКГ'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-emerald-200/50">
                    {formatDate(item.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
