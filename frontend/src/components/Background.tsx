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
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Слой 2: emerald-пятно в левом верхнем углу */}
      <div
        className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full blur-3xl
                   bg-emerald-500/5 dark:bg-emerald-500/10"
      />
      {/* Слой 2: emerald-пятно в правом нижнем углу */}
      <div
        className="absolute -bottom-40 -right-40 w-[36rem] h-[36rem] rounded-full blur-3xl
                   bg-emerald-500/5 dark:bg-emerald-500/10"
      />
    </div>
  )
}
