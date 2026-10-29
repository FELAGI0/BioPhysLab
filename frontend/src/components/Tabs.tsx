/** Переключатель вкладок BioPhysLab. */

interface TabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <nav
      className="flex gap-6 border-b border-slate-200 dark:border-emerald-900/50"
      aria-label="Вкладки"
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={
            'pb-2 text-sm font-medium transition-all duration-200 active:scale-95 ' +
            (tab === active
              ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-b-2 border-transparent text-slate-500 dark:text-emerald-200/60 hover:text-slate-700 dark:hover:text-emerald-100')
          }
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}
