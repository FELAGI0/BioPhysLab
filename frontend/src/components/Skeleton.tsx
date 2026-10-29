/** Skeleton-загрузка: серые пульсирующие блоки вместо резкого появления. */

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={
        'animate-pulse rounded-lg bg-gray-200 dark:bg-slate-800 ' + className
      }
    />
  )
}

/** Skeleton карточки истории (бейдж + дата + 2 строки текста + кнопки). */
export function HistoryCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
      <div className="flex gap-2 items-center">
        <SkeletonBlock className="h-4 w-16" />
        <SkeletonBlock className="h-3 w-32" />
      </div>
      <SkeletonBlock className="h-4 w-3/4 mt-3" />
      <div className="flex gap-2 mt-4">
        <SkeletonBlock className="h-6 w-24" />
        <SkeletonBlock className="h-6 w-20" />
        <SkeletonBlock className="h-6 w-20" />
      </div>
    </div>
  )
}

/** Skeleton вкладки статистики (3 карточки + 2 таблицы). */
export function StatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700
                       rounded-xl p-4 shadow-sm text-center"
          >
            <SkeletonBlock className="h-8 w-16 mx-auto" />
            <SkeletonBlock className="h-3 w-20 mx-auto mt-2" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700
                       rounded-xl p-4 shadow-sm space-y-2"
          >
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-5/6" />
            <SkeletonBlock className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
