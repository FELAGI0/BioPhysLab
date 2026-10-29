/** BioPhysLab — UI: 5 вкладок, авторизация, тёмная тема, страница шаринга. */

import { useState } from 'react'
import { AuthModal } from './components/AuthModal'
import { EcgTab } from './components/EcgTab'
import { ExplainTab } from './components/ExplainTab'
import { FaqModal } from './components/FaqModal'
import { HistoryTab } from './components/HistoryTab'
import { LicenseModal } from './components/LicenseModal'
import { SharedPage } from './components/SharedPage'
import { SolverTab } from './components/SolverTab'
import { StatsTab } from './components/StatsTab'
import { Tabs } from './components/Tabs'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useTheme } from './hooks/useTheme'

const TABS = ['ЭКГ', 'Задачи', 'Объяснения', 'Статистика', 'История'] as const
type Tab = (typeof TABS)[number]

/** Иконка солнца/луны для переключателя темы. */
function ThemeToggleIcon({ dark }: { dark: boolean }) {
  return dark ? (
    // Луна
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  ) : (
    // Солнце
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

/** Блок в шапке справа: тема + авторизация. */
function HeaderControls() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
        title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        className="border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300
                   rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700
                   transition-all duration-200 active:scale-95"
      >
        <ThemeToggleIcon dark={theme === 'dark'} />
      </button>

      {user ? (
        <>
          <span
            className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-40 hidden sm:inline"
            title={user}
          >
            {user}
          </span>
          <button
            type="button"
            onClick={logout}
            className="border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300
                       rounded-lg px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-slate-700
                       transition-all duration-200 active:scale-95"
          >
            Выйти
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300
                     bg-blue-50 dark:bg-blue-900/40 rounded-lg px-3 py-1 text-xs
                     hover:bg-blue-100 dark:hover:bg-blue-900/70
                     transition-all duration-200 active:scale-95"
        >
          Войти
        </button>
      )}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  )
}

function AppInner() {
  const [activeTab, setActiveTab] = useState<Tab>('ЭКГ')
  const [modal, setModal] = useState<'faq' | 'license' | null>(null)

  // Простой роутинг без react-router: /shared/{token} — публичная страница.
  if (window.location.pathname.startsWith('/shared/')) {
    const token = window.location.pathname.slice('/shared/'.length)
    return <SharedPage token={token} />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <div className="max-w-4xl mx-auto p-6 w-full flex-1">
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              BioPhysLab
            </h1>
            <div className="ml-auto">
              <HeaderControls />
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            ИИ-помощник по биофизике
          </p>
        </header>

        <div className="mb-6">
          <Tabs
            tabs={[...TABS]}
            active={activeTab}
            onChange={(t) => setActiveTab(t as Tab)}
          />
        </div>

        {/* key={activeTab}: контент вкладки плавно появляется при смене. */}
        <main key={activeTab} className="animate-fadeIn">
          {activeTab === 'ЭКГ' && <EcgTab />}
          {activeTab === 'Задачи' && <SolverTab />}
          {activeTab === 'Объяснения' && <ExplainTab />}
          {activeTab === 'Статистика' && <StatsTab />}
          {activeTab === 'История' && <HistoryTab />}
        </main>
      </div>

      <footer className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-4 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-6 text-xs text-gray-400 dark:text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 justify-between">
          <p>Проект не заменяет консультацию врача. © 2026 BioPhysLab.</p>
          <nav className="flex gap-4" aria-label="Информация о проекте">
            <button
              type="button"
              onClick={() => setModal('faq')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-all duration-200"
            >
              О проекте (FAQ)
            </button>
            <button
              type="button"
              onClick={() => setModal('license')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-all duration-200"
            >
              Лицензия
            </button>
          </nav>
        </div>
      </footer>

      {modal === 'faq' && <FaqModal onClose={() => setModal(null)} />}
      {modal === 'license' && <LicenseModal onClose={() => setModal(null)} />}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

export default App
