/** Хук тёмной темы: localStorage + prefers-color-scheme, класс dark на <html>. */

import { useEffect, useState } from 'react'

const THEME_KEY = 'biophyslab_theme'
type Theme = 'dark' | 'light'

/** Читает тему: localStorage, иначе системную. */
function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // localStorage недоступен — берём системную
  }
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
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
