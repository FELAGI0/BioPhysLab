/** Вкладка «ЭКГ»: загрузка изображения, превью, разбор через analyzeEcg. */

import { useEffect, useState } from 'react'
import { analyzeEcg } from '../api'
import { useAsync } from '../hooks/useAsync'
import { ErrorBlock } from './ErrorBlock'
import { Spinner } from './Spinner'

const BUTTON =
  'bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

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
      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Изображение ЭКГ (png/jpg, до 5 МБ)
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={onFileChange}
            className="block w-full text-sm text-gray-500
                       file:mr-3 file:rounded-lg file:border-0
                       file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700
                       hover:file:bg-blue-100"
          />
        </label>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Предпросмотр ЭКГ"
            className="max-h-64 rounded-lg border"
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

        {loading && <Spinner text="Анализируем..." />}
        {error && <ErrorBlock message={error} />}
      </div>

      {data?.result && (
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Результат разбора
          </h3>
          <pre className="whitespace-pre-wrap text-sm text-gray-700">
            {data.result}
          </pre>
        </div>
      )}
    </div>
  )
}
