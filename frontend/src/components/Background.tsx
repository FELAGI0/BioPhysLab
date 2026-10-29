/**
 * Декоративный фон: слабая сетка + два размытых emerald-пятна.
 * Fixed, z-index -1 — не скроллится и не перекрывает контент.
 * В светлой теме сетка слабее и пятна едва заметны.
 */

export function Background() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
    >
      {/* Слой 1: очень слабая сетка (3–5%) */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  )
}
