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
  'bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95'

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
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-4 transition-colors duration-200">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Изображение ЭКГ (png/jpg, до 5 МБ)
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={onFileChange}
            className="block w-full text-sm text-gray-500 dark:text-slate-400
                       file:mr-3 file:rounded-lg file:border-0
                       file:bg-blue-50 dark:file:bg-slate-700
                       file:px-4 file:py-2 file:text-blue-700 dark:file:text-blue-300
                       hover:file:bg-blue-100 dark:hover:file:bg-gray-600
                       file:transition-colors file:duration-200"
          />
        </label>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Предпросмотр ЭКГ"
            className="max-h-64 rounded-lg border border-gray-200 dark:border-slate-700"
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
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
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
