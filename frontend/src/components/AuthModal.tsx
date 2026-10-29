/** Модальное окно авторизации: вход и регистрация (переключатель). */

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Modal } from './Modal'

interface AuthModalProps {
  onClose: () => void
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isLogin = mode === 'login'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={isLogin ? 'Вход' : 'Регистрация'}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={
              'px-3 py-1.5 text-sm rounded-lg transition-colors ' +
              (isLogin
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600')
            }
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={
              'px-3 py-1.5 text-sm rounded-lg transition-colors ' +
              (!isLogin
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600')
            }
          >
            Регистрация
          </button>
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 text-sm
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Пароль
          </span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 text-sm
                       focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>

        {error && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="bg-blue-600 dark:bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-700 dark:hover:bg-blue-600
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 w-full"
        >
          {busy ? 'Подождите...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>
    </Modal>
  )
}
