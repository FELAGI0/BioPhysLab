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
  'bg-emerald-600 dark:bg-emerald-500 dark:text-black font-semibold text-white rounded-lg px-6 py-3 text-base hover:bg-emerald-700 dark:hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 МБ
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

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
  const [fileError, setFileError] = useState<string | null>(null)
  const [recent, setRecent] = useState<HistoryItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

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

  /** Проверяет тип (png/jpg) и размер (до 5 МБ); принимает или отклоняет файл. */
  const acceptFile = (selected: File | null) => {
    setFileError(null)
    if (!selected) return
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setFileError('Допустимы только изображения PNG или JPG')
      return
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      setFileError('Файл слишком большой (максимум 5 МБ)')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0] ?? null)
  }

  // dragCounter: dragenter/dragleave на дочерних элементах не «мигают» —
  //enter увеличивает счётчик, leave уменьшает; активность = счётчик > 0.
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current += 1
    setDragActive(true)
  }

  const onDragOver = (e: React.DragEvent) => {
    // preventDefault обязателен: без него браузер открывает файл вместо drop.
    e.preventDefault()
    setDragActive(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setDragActive(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    // stopPropagation: чтобы событие не всплывло и браузер не открыл файл.
    e.stopPropagation()
    dragCounter.current = 0
    setDragActive(false)
    acceptFile(e.dataTransfer.files?.[0] ?? null)
  }

  // ===== Рабочая область (файл выбран или результат есть) =====
  if (file || data?.result) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#16201A] border border-slate-200 dark:border-[#1F2E24] rounded-xl p-4  space-y-4 transition-colors duration-200">
          {/* Зона загрузки (drag & drop), крупная */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ')
                fileInputRef.current?.click()
            }}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={
              'flex flex-col items-center justify-center gap-2 min-h-[200px] p-6 rounded-xl cursor-pointer ' +
              'border-2 border-dashed border-slate-300 dark:border-[#1F2E24] transition-colors duration-200 ' +
              (dragActive
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                : 'hover:border-emerald-400 dark:hover:border-emerald-700')
            }
          >
            <IconUpload size={36} className="text-slate-500 dark:text-emerald-400" />
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

          {fileError && <ErrorBlock message={fileError} />}

          {previewUrl && (
            <div className="space-y-3">
              <img
                src={previewUrl}
                alt="Предпросмотр ЭКГ"
                className="max-h-64 rounded-lg border border-slate-200 dark:border-[#1F2E24]"
              />
              <button
                type="button"
                className={BUTTON + ' inline-flex items-center gap-2'}
                disabled={!file || loading}
                onClick={run}
              >
                <IconDoctor size={18} />
                {loading ? 'Анализируем...' : 'Проанализировать'}
              </button>
            </div>
          )}

          {loading && (
            <Spinner text="Анализируем ЭКГ... (обычно 10–15 секунд)" />
          )}
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
    <div className="space-y-12">
      <section className="text-center space-y-6 pt-8 max-w-6xl mx-auto animate-fadeIn">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-emerald-50">
          ИИ-анализ электрокардиограмм
        </h2>
        <p className="text-lg md:text-xl text-slate-500 dark:text-emerald-100/70 max-w-2xl mx-auto">
          BioPhysLab разбирает снимки ЭКГ и объясняет каждый вывод —
          как врач-биофизик, только быстрее.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-4">
          <div
            className="bg-white dark:bg-[#16201A] border border-slate-200 dark:border-[#1F2E24] rounded-xl p-6
                       hover:-translate-y-1 transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: '100ms' }}
          >
            <IconEcg size={40} className="mx-auto mb-4 text-slate-600 dark:text-emerald-400" />
            <p className="text-sm text-slate-700 dark:text-emerald-50">
              Анализ за 5–10 секунд
            </p>
          </div>
          <div
            className="bg-white dark:bg-[#16201A] border border-slate-200 dark:border-[#1F2E24] rounded-xl p-6
                       hover:-translate-y-1 transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: '200ms' }}
          >
            <IconExplain size={40} className="mx-auto mb-4 text-slate-600 dark:text-emerald-400" />
            <p className="text-sm text-slate-700 dark:text-emerald-50">
              Объяснение каждого вывода
            </p>
          </div>
          <div
            className="bg-white dark:bg-[#16201A] border border-slate-200 dark:border-[#1F2E24] rounded-xl p-6
                       hover:-translate-y-1 transition-all duration-300 animate-fadeIn"
            style={{ animationDelay: '300ms' }}
          >
            <IconHistory size={40} className="mx-auto mb-4 text-slate-600 dark:text-emerald-400" />
            <p className="text-sm text-slate-700 dark:text-emerald-50">
              История исследований
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={
            'bg-emerald-600 dark:bg-emerald-500 dark:text-black font-semibold text-white rounded-lg ' +
            'px-8 py-4 text-lg inline-flex items-center gap-2 mx-auto mt-4 ' +
            'hover:bg-emerald-700 dark:hover:bg-emerald-400 ' +
            'hover:scale-105 ' +
            'transition-all duration-300 active:scale-95 animate-fadeIn'
          }
          style={{ animationDelay: '400ms' }}
        >
          <IconUpload size={22} />
          Загрузить ЭКГ
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={onFileChange}
          className="hidden"
        />
        {fileError && <ErrorBlock message={fileError} />}
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
                className="bg-white dark:bg-[#16201A] border border-slate-200 dark:border-[#1F2E24]
                           rounded-xl p-3  flex items-center gap-3
                           hover:shadow-md transition-all duration-200"
              >
                <span className="shrink-0 text-slate-500 dark:text-emerald-400">
                  <IconEcg size={20} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 dark:text-emerald-50 truncate">
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
