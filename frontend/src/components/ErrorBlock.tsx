/** Красный блок с текстом ошибки (общий для вкладок). */

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm"
    >
      {message}
    </div>
  )
}
