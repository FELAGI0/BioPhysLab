/** BioPhysLab — UI с четырьмя вкладками: ЭКГ, Задачи, Объяснения, Статистика. */

import { useState } from 'react'
import { EcgTab } from './components/EcgTab'
import { ExplainTab } from './components/ExplainTab'
import { SolverTab } from './components/SolverTab'
import { StatsTab } from './components/StatsTab'
import { Tabs } from './components/Tabs'

const TABS = ['ЭКГ', 'Задачи', 'Объяснения', 'Статистика'] as const
type Tab = (typeof TABS)[number]

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('ЭКГ')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-4xl mx-auto p-6 w-full flex-1">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">BioPhysLab</h1>
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
        <p className="max-w-4xl mx-auto px-6 text-xs text-gray-400">
          Учебный проект. Не заменяет консультацию врача.
        </p>
      </footer>
    </div>
  )
}

export default App
