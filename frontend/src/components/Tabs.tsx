/** Переключатель вкладок BioPhysLab. */

interface TabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <nav className="flex gap-6 border-b border-gray-200" aria-label="Вкладки">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={
            'pb-2 text-sm font-medium transition-colors ' +
            (tab === active
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700')
          }
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}
