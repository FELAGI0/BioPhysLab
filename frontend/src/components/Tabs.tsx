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
  { label: 'Калькулятор', icon: IconStats },
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
      className="hide-scrollbar flex flex-nowrap gap-4 overflow-x-auto border-b border-slate-200 dark:border-[#1F2E24] md:gap-6"
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
              'flex shrink-0 items-center gap-1 pb-2 text-xs font-medium transition-colors duration-200 active:scale-95 md:gap-1.5 md:text-sm ' +
              (isActive
                ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-300 [&>svg]:text-emerald-500 dark:[&>svg]:text-emerald-300'
                : 'border-b-2 border-transparent text-slate-500 dark:text-slate-300/75 hover:text-emerald-600 dark:hover:text-emerald-300 [&>svg]:text-slate-500 dark:[&>svg]:text-slate-300/75 dark:hover:[&>svg]:text-emerald-300')
            }
          >
            <Icon size={14} />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
