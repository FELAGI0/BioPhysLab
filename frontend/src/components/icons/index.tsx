/**
 * Кастомные линейные SVG-иконки BioPhysLab.
 * Единый стиль: stroke="currentColor", fill="none", stroke-width="2",
 * viewBox="0 0 24 24", скруглённые концы линий.
 */

interface IconProps {
  size?: number
  className?: string
}

function base(props: IconProps) {
  return {
    width: props.size ?? 16,
    height: props.size ?? 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
}

/** Сердце с кардиограммой. */
export function IconEcg(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M19.8 7.4a4.2 4.2 0 0 0-6.5-1.3L12 7.2l-1.3-1.1a4.2 4.2 0 1 0-5.2 6.6l6.5 6.5 6.5-6.5a4.2 4.2 0 0 0 1.3-5.3Z" />
      <path d="M4 12h3l2-4 3 8 2-4h6" />
    </svg>
  )
}

/** Мозг/формулы — условная «думающая» иконка. */
export function IconSolver(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 4a3 3 0 0 0-3 3 3 3 0 0 0-2 2.8 3 3 0 0 0 1.5 2.6A3 3 0 0 0 8 20h1V4H8Z" />
      <path d="M16 4a3 3 0 0 1 3 3 3 3 0 0 1 2 2.8 3 3 0 0 1-1.5 2.6A3 3 0 0 1 16 20h-1V4h1Z" />
    </svg>
  )
}

/** Книга-объяснение. */
export function IconExplain(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 6.5C10.5 5 8.5 4.5 4 4.5v13c4.5 0 6.5.5 8 2 1.5-1.5 3.5-2 8-2v-13c-4.5 0-6.5.5-8 2Z" />
      <path d="M12 6.5v13" />
    </svg>
  )
}

/** Столбчатый график. */
export function IconStats(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-8" />
      <path d="M22 20H2" />
    </svg>
  )
}

/** Часы-история. */
export function IconHistory(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

/** Загрузка — стрелка вверх в область. */
export function IconUpload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  )
}

/** Медицинский крест — «анализ врача». */
export function IconDoctor(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z" />
    </svg>
  )
}

/** Солнце — светлая тема. */
export function IconSun(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

/** Луна — тёмная тема. */
export function IconMoon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  )
}
