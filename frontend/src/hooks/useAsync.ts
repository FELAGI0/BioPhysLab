import { useCallback, useState } from 'react'

/**
 * Generic-хук для асинхронных действий: data / error / loading / run.
 * run() вызывает переданную функцию, ловит ошибку и управляет loading.
 */
export function useAsync<T>(fn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn()
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [fn])

  return { data, error, loading, run }
}
