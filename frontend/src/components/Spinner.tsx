/** Спиннер загрузки + текст (общий для вкладок). */

export function Spinner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
        aria-hidden="true"
      />
      {text}
    </div>
  )
}
