/** Переключатель вкладок BioPhysLab. */

interface TabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <nav
      className="flex gap-6 border-b border-gray-200 dark:border-slate-700"
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
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-b-2 border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-gray-200')
          }
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}
