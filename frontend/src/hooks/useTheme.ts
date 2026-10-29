/** Хук тёмной темы: localStorage + расписание день/ночь + prefers-color-scheme.
 *
 * ЭКСПЕРИМЕНТ: если пользователь НЕ выбирал тему вручную (нет записи в
 * localStorage), тема выбирается по расписанию: 07:00–20:00 — светлая,
 * остальное время — тёмная («ночная смена»). Ручной клик фиксирует выбор.
 */

import { useEffect, useState } from 'react'

const THEME_KEY = 'biophyslab_theme'
type Theme = 'dark' | 'light'

/** Есть ли сохранённый ручной выбор темы. */
function hasStoredTheme(): boolean {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return stored === 'dark' || stored === 'light'
  } catch {
    return false
  }
}

/** Тема по расписанию: 07:00–20:00 — светлая, иначе тёмная. */
function scheduledTheme(): Theme {
  const hour = new Date().getHours()
  return hour >= 7 && hour < 20 ? 'light' : 'dark'
}

/** Читает тему: ручной выбор -> расписание -> системную. */
function getInitialTheme(): Theme {
  if (hasStoredTheme()) {
    try {
      const stored = localStorage.getItem(THEME_KEY)
      if (stored === 'dark' || stored === 'light') return stored
    } catch {
      // ignore
    }
  }
  if (scheduledTheme() !== 'light' || !window.matchMedia('(prefers-color-scheme: light)').matches) {
    return scheduledTheme()
  }
  return 'light'
}

/** Ставит/снимает класс dark на <html>. */
function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // Применяем тему при монтировании и при смене.
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // localStorage недоступен — просто переключаем без сохранения
    }
  }

  return { theme, toggle }
}
