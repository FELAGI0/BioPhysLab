/** Красный блок с текстом ошибки (общий для вкладок). */

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800
                 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm"
    >
      {message}
    </div>
  )
}
