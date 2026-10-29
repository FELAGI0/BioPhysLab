/** Спиннер загрузки + текст (общий для вкладок). */

export function Spinner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-emerald-200/60 animate-pulse">
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 dark:border-emerald-900/50 border-t-emerald-500"
        aria-hidden="true"
      />
      {text}
    </div>
  )
}
