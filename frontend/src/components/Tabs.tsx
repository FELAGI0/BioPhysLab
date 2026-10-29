/** Переключатель вкладок BioPhysLab с кастомными иконками. */

import type { ComponentType } from 'react'
import {
  IconEcg,
  IconExplain,
  IconHistory,
  IconSolver,
  IconStats,
} from './icons'

interface TabDef {
  label: string
  icon: ComponentType<{ size?: number }>
}

const TAB_DEFS: TabDef[] = [
  { label: 'ЭКГ', icon: IconEcg },
  { label: 'Задачи', icon: IconSolver },
  { label: 'Объяснения', icon: IconExplain },
  { label: 'Статистика', icon: IconStats },
  { label: 'История', icon: IconHistory },
]

interface TabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <nav
      className="flex gap-6 border-b border-slate-200 dark:border-[#1F2E24]"
      aria-label="Вкладки"
    >
      {TAB_DEFS.filter((t) => tabs.includes(t.label)).map((tab) => {
        const Icon = tab.icon
        const isActive = tab.label === active
        return (
          <button
            key={tab.label}
            type="button"
            onClick={() => onChange(tab.label)}
            className={
              'flex items-center gap-1.5 pb-2 text-sm font-medium transition-all duration-200 active:scale-95 ' +
              (isActive
                ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400'
                : 'border-b-2 border-transparent text-slate-500 dark:text-emerald-200/60 hover:text-slate-700 dark:hover:text-emerald-100 [&>svg]:text-slate-500 dark:[&>svg]:text-emerald-500')
            }
          >
            <Icon size={16} />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
