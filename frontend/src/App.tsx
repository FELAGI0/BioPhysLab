/** BioPhysLab — UI с пятью вкладками, авторизацией и публичной страницей шаринга. */

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

const TABS = ['ЭКГ', 'Задачи', 'Объяснения', 'Статистика', 'История'] as const
type Tab = (typeof TABS)[number]

/** Блок авторизации в шапке: email + «Выйти» или кнопка «Войти». */
function AuthHeader() {
  const { user, logout } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <>
      {user ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 truncate max-w-40" title={user}>
            {user}
          </span>
          <button
            type="button"
            onClick={logout}
            className="border border-gray-300 text-gray-600 rounded-lg px-2 py-1 text-xs
                       hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            Выйти
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="border border-blue-300 text-blue-700 bg-blue-50 rounded-lg px-3 py-1 text-xs
                     hover:bg-blue-100 transition-colors"
        >
          Войти
        </button>
      )}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-4xl mx-auto p-6 w-full flex-1">
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">BioPhysLab</h1>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
              MVP
            </span>
            <div className="ml-auto">
              <AuthHeader />
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
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

        <main>
          {activeTab === 'ЭКГ' && <EcgTab />}
          {activeTab === 'Задачи' && <SolverTab />}
          {activeTab === 'Объяснения' && <ExplainTab />}
          {activeTab === 'Статистика' && <StatsTab />}
          {activeTab === 'История' && <HistoryTab />}
        </main>
      </div>

      <footer className="border-t border-gray-200 bg-white py-4">
        <div className="max-w-4xl mx-auto px-6 text-xs text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-1 justify-between">
          <p>Проект не заменяет консультацию врача. © 2026 BioPhysLab.</p>
          <nav className="flex gap-4" aria-label="Информация о проекте">
            <button
              type="button"
              onClick={() => setModal('faq')}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              О проекте (FAQ)
            </button>
            <button
              type="button"
              onClick={() => setModal('license')}
              className="text-blue-600 hover:text-blue-700 hover:underline"
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
