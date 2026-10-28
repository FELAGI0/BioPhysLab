/** BioPhysLab — UI с четырьмя вкладками: ЭКГ, Задачи, Объяснения, Статистика. */

import { useState } from 'react'
import { EcgTab } from './components/EcgTab'
import { ExplainTab } from './components/ExplainTab'
import { FaqModal } from './components/FaqModal'
import { LicenseModal } from './components/LicenseModal'
import { SolverTab } from './components/SolverTab'
import { StatsTab } from './components/StatsTab'
import { Tabs } from './components/Tabs'

const TABS = ['ЭКГ', 'Задачи', 'Объяснения', 'Статистика'] as const
type Tab = (typeof TABS)[number]

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('ЭКГ')
  const [modal, setModal] = useState<'faq' | 'license' | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-4xl mx-auto p-6 w-full flex-1">
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">BioPhysLab</h1>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
              MVP
            </span>
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

export default App
