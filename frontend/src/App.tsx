/** BioPhysLab — UI: 5 вкладок, авторизация, тёмная тема, страница шаринга. */

import { useState } from 'react'
import { AuthModal } from './components/AuthModal'
import { Background } from './components/Background'
import { EcgTab } from './components/EcgTab'
import { ExplainTab } from './components/ExplainTab'
import { FaqModal } from './components/FaqModal'
import { HistoryTab } from './components/HistoryTab'
import { IconEcg, IconMoon, IconSun } from './components/icons'
import { LicenseModal } from './components/LicenseModal'
import { NernstTab } from './components/NernstTab'
import { SharedPage } from './components/SharedPage'
import { SolverTab } from './components/SolverTab'
import { StatsTab } from './components/StatsTab'
import { Tabs } from './components/Tabs'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useTheme } from './hooks/useTheme'

const TABS = ['ЭКГ', 'Задачи', 'Объяснения', 'Калькулятор', 'Статистика', 'История'] as const
type Tab = (typeof TABS)[number]

/** Иконка солнца/луны для переключателя темы. */
function ThemeToggleIcon({ dark }: { dark: boolean }) {
  return dark ? <IconMoon size={16} /> : <IconSun size={16} />
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
        className="border border-slate-300 dark:border-[#1F2E24] text-slate-600 dark:text-slate-200
                   rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.04]
                   transition-all duration-200 active:scale-95"
      >
        <ThemeToggleIcon dark={theme === 'dark'} />
      </button>

      {user ? (
        <>
          <span
            className="text-xs text-slate-500 dark:text-slate-300/70 truncate max-w-40 hidden sm:inline"
            title={user}
          >
            {user}
          </span>
          <button
            type="button"
            onClick={logout}
            className="border border-slate-300 dark:border-[#1F2E24] text-slate-600 dark:text-slate-200
                       rounded-lg px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-white/[0.04]
                       transition-all duration-200 active:scale-95"
          >
            Выйти
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg px-3.5 py-1.5 text-sm
                     hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-200 active:scale-95"
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1513] flex flex-col transition-colors duration-200">
      <Background />
      <div className="max-w-4xl mx-auto p-6 w-full flex-1">
        <header className="mb-6">
          <div className="flex items-center gap-2.5">
            <IconEcg size={26} className="text-slate-600 dark:text-emerald-500" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-emerald-50">
              BioPhysLab
            </h1>
            <div className="ml-auto">
              <HeaderControls />
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-emerald-200/60">
            ИИ-помощник по биофизике
          </p>
        </header>

        <div className="mb-8">
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
          {activeTab === 'Калькулятор' && <NernstTab />}
          {activeTab === 'Статистика' && <StatsTab />}
          {activeTab === 'История' && <HistoryTab />}
        </main>
      </div>

      <footer className="border-t border-slate-200 dark:border-emerald-900/30 bg-white dark:bg-[#16201A] py-8 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-6 text-xs text-slate-400 dark:text-emerald-200/50 flex flex-col items-center gap-3 text-center">
          <p>Проект не заменяет консультацию врача. © 2026 BioPhysLab.</p>
          <nav className="flex gap-6" aria-label="Информация о проекте">
            <button
              type="button"
              onClick={() => setModal('faq')}
              className="text-slate-500 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors duration-200"
            >
              О проекте (FAQ)
            </button>
            <button
              type="button"
              onClick={() => setModal('license')}
              className="text-slate-500 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors duration-200"
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
