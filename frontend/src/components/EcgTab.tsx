/** Вкладка «ЭКГ»: загрузка изображения, превью, разбор через analyzeEcg. */

import { useEffect, useState } from 'react'
import { analyzeEcg } from '../api'
import { useAsync } from '../hooks/useAsync'
import { CopyButton } from './CopyButton'
import { ErrorBlock } from './ErrorBlock'
import { MarkdownView } from './MarkdownView'
import { ShareButton } from './ShareButton'
import { Spinner } from './Spinner'

const BUTTON =
  'bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95'

export function EcgTab() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Освобождаем URL превью при смене файла и при размонтировании.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const { data, error, loading, run } = useAsync(() =>
    file ? analyzeEcg(file) : Promise.reject(new Error('Файл не выбран')),
  )

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(selected)
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#121a17] border border-slate-200 dark:border-emerald-900/50 rounded-xl p-4 shadow-sm space-y-4 transition-colors duration-200">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 dark:text-emerald-200/70 mb-1">
            Изображение ЭКГ (png/jpg, до 5 МБ)
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={onFileChange}
            className="block w-full text-sm text-slate-500 dark:text-emerald-200/60
                       file:mr-3 file:rounded-lg file:border-0
                       file:bg-emerald-50 dark:file:bg-emerald-900/40
                       file:px-4 file:py-2 file:text-emerald-700 dark:file:text-emerald-300
                       hover:file:bg-emerald-100 dark:hover:file:bg-emerald-900/60
                       file:transition-colors file:duration-200"
          />
        </label>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Предпросмотр ЭКГ"
            className="max-h-64 rounded-lg border border-slate-200 dark:border-emerald-900/50"
          />
        )}

        <button
          type="button"
          className={BUTTON}
          disabled={!file || loading}
          onClick={run}
        >
          Разобрать ЭКГ
        </button>

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
