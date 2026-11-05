/**
 * Калькулятор: 8 биофизических формул из методички, локальный расчёт (без AI).
 * Две категории: «Мембраны» (Нернст, ГХК, Фик, Нернст—Планк) и «Гидродинамика»
 * (Пуазейль, Вязкость, Рейнольдс, Бернулли). Формулы выводятся крупно через KaTeX.
 */

import { useState } from 'react'
import { IconSolver } from './icons'
import { MarkdownView } from './MarkdownView'

// Универсальные физические константы (СИ).
const R = 8.314 // газовая постоянная, Дж/(моль·К)
const F = 96485 // постоянная Фарадея, Кл/моль

/* ---------- Типы декларативных определений калькуляторов ---------- */

interface CalcField {
  /** Ключ в состоянии формы. */
  key: string
  /** Подпись поля. */
  label: string
  /** Единица измерения (для подписи). */
  unit?: string
  /** Значение по умолчанию. */
  default: number
}

interface CalcDef {
  id: string
  title: string
  /** LaTeX-формула для блока $$...$$ (рендерится KaTeX). */
  formula: string
  fields: CalcField[]
  /** Расчёт по значениям полей. Возвращает [значение, единица, подпись]. */
  compute: (v: Record<string, number>) => { value: number; unit: string; note?: string }
}

interface CategoryDef {
  id: string
  label: string
  calcs: CalcDef[]
}

/* ---------- Физика (строго по методичке) ---------- */

// A) Уравнение Нернста: E = (RT / zF) · ln(C_out / C_in), результат в мВ.
const nernst: CalcDef = {
  id: 'nernst',
  title: 'Уравнение Нернста',
  formula: 'E = \\frac{RT}{zF} \\ln\\frac{C_{\\text{нар}}}{C_{\\text{вн}}}',
  fields: [
    { key: 'T', label: 'T — температура', unit: 'К', default: 310.15 },
    { key: 'z', label: 'z — заряд иона', default: 1 },
    { key: 'C_out', label: 'C_нар — концентрация снаружи', unit: 'ммоль/л', default: 4 },
    { key: 'C_in', label: 'C_вн — концентрация внутри', unit: 'ммоль/л', default: 140 },
  ],
  compute: (v) => {
    if (v.z === 0) {
      return { value: NaN, unit: 'мВ', note: 'Заряд z не может быть нулём' }
    }
    if (v.C_in === 0 || v.C_out === 0) {
      return { value: NaN, unit: 'мВ', note: 'Концентрации должны быть больше нуля' }
    }
    const e = ((R * v.T) / (v.z * F)) * Math.log(v.C_out / v.C_in) // вольты
    return { value: e * 1000, unit: 'мВ' }
  },
}

// B) ГХК: V_m = (RT/F) · ln(...) с проницаемостями, результат в мВ.
const ghk: CalcDef = {
  id: 'ghk',
  title: 'Уравнение Гольдмана—Ходжкина—Каца',
  formula:
    'V_m = \\frac{RT}{F} \\ln ' +
    '\\frac{P_K [K]_{\\text{нар}} + P_{Na} [Na]_{\\text{нар}} + P_{Cl} [Cl]_{\\text{вн}}} ' +
    '{P_K [K]_{\\text{вн}} + P_{Na} [Na]_{\\text{вн}} + P_{Cl} [Cl]_{\\text{нар}}}',
  fields: [
    { key: 'T', label: 'T — температура', unit: 'К', default: 310.15 },
    { key: 'P_K', label: 'P_K — проницаемость K⁺', default: 1 },
    { key: 'P_Na', label: 'P_Na — проницаемость Na⁺', default: 0.04 },
    { key: 'P_Cl', label: 'P_Cl — проницаемость Cl⁻', default: 0.45 },
    { key: 'K_in', label: '[K]_вн', unit: 'ммоль/л', default: 140 },
    { key: 'K_out', label: '[K]_нар', unit: 'ммоль/л', default: 4 },
    { key: 'Na_in', label: '[Na]_вн', unit: 'ммоль/л', default: 12 },
    { key: 'Na_out', label: '[Na]_нар', unit: 'ммоль/л', default: 145 },
    { key: 'Cl_in', label: '[Cl]_вн', unit: 'ммоль/л', default: 4 },
    { key: 'Cl_out', label: '[Cl]_нар', unit: 'ммоль/л', default: 110 },
  ],
  compute: (v) => {
    if (v.T <= 0) {
      return { value: NaN, unit: 'мВ', note: 'Температура должна быть больше нуля' }
    }
    const num = v.P_K * v.K_out + v.P_Na * v.Na_out + v.P_Cl * v.Cl_in
    const den = v.P_K * v.K_in + v.P_Na * v.Na_in + v.P_Cl * v.Cl_out
    if (num <= 0 || den <= 0) {
      return {
        value: NaN,
        unit: 'мВ',
        note: 'Числитель и знаменатель ГХК должны быть положительными',
      }
    }
    const vm = ((R * v.T) / F) * Math.log(num / den)
    return { value: vm * 1000, unit: 'мВ' }
  },
}

// C) Уравнение Фика: J = -D · (dC/dx) · S, результат в моль/с.
const fick: CalcDef = {
  id: 'fick',
  title: 'Уравнение Фика',
  formula: 'J = -D \\frac{dC}{dx} S',
  fields: [
    { key: 'D', label: 'Коэф. диффузии (D)', unit: 'м²/с', default: 1e-9 },
    { key: 'gradC', label: 'Градиент концентрации (dC/dx)', unit: 'моль/м⁴', default: 1e6 },
    { key: 'S', label: 'Площадь (S)', unit: 'м²', default: 1e-4 },
  ],
  compute: (v) => ({ value: -v.D * v.gradC * v.S, unit: 'моль/с' }),
}

// C2) Уравнение Нернста—Планка (упрощённое): J = -D · (dC/dx) + (zFC/RT) · E.
const nernstPlanck: CalcDef = {
  id: 'nernst-planck',
  title: 'Уравнение Нернста—Планка (упрощённое)',
  formula: 'J = -D \\frac{dC}{dx} + \\frac{zFC}{RT} E',
  fields: [
    { key: 'D', label: 'Коэф. диффузии (D)', unit: 'м²/с', default: 1e-9 },
    { key: 'gradC', label: 'Градиент концентрации (dC/dx)', unit: 'моль/м⁴', default: 1e6 },
    { key: 'z', label: 'Заряд иона (z)', default: 1 },
    { key: 'C', label: 'Концентрация (C)', unit: 'моль/м³', default: 1 },
    { key: 'T', label: 'Температура (T)', unit: 'К', default: 310.15 },
    { key: 'E', label: 'Напряжённость поля (E)', unit: 'В/м', default: 1e4 },
  ],
  compute: (v) => {
    if (v.T <= 0) {
      return { value: NaN, unit: 'моль/(м²·с)', note: 'Температура должна быть больше нуля' }
    }
    const j = -v.D * v.gradC + ((v.z * F * v.C) / (R * v.T)) * v.E
    return { value: j, unit: 'моль/(м²·с)' }
  },
}

// D) Формула Пуазейля: Q = π R⁴ ΔP / (8 η L), результат в мл/с.
const poiseuille: CalcDef = {
  id: 'poiseuille',
  title: 'Формула Пуазейля (объёмный кровоток)',
  formula: 'Q = \\frac{\\pi R^4 \\Delta P}{8 \\eta L}',
  fields: [
    { key: 'r', label: 'R — радиус', unit: 'м', default: 0.002 },
    { key: 'dP', label: 'ΔP — разность давлений', unit: 'Па', default: 13332 },
    { key: 'eta', label: 'η — вязкость', unit: 'Па·с', default: 0.0035 },
    { key: 'L', label: 'L — длина', unit: 'м', default: 0.1 },
  ],
  compute: (v) => {
    if (v.eta === 0 || v.L === 0) {
      return {
        value: NaN,
        unit: 'м³/с',
        note: 'Вязкость η и длина L не могут быть нулём',
      }
    }
    const q = (Math.PI * v.r ** 4 * v.dP) / (8 * v.eta * v.L) // м³/с
    return { value: q, unit: 'м³/с', note: `${(q * 1e6).toPrecision(4)} мл/с` }
  },
}

// E) Вязкость по Ньютону: F = η · (dv/dx) · S, результат в ньютонах.
const viscosity: CalcDef = {
  id: 'viscosity',
  title: 'Вязкость жидкости (уравнение Ньютона)',
  formula: 'F = \\eta \\frac{dv}{dx} S',
  fields: [
    { key: 'eta', label: 'Вязкость (η)', unit: 'Па·с', default: 0.0035 },
    { key: 'grad', label: 'Градиент скорости (dv/dx)', unit: '1/с', default: 100 },
    { key: 'S', label: 'Площадь (S)', unit: 'м²', default: 1e-4 },
  ],
  compute: (v) => ({ value: v.eta * v.grad * v.S, unit: 'Н' }),
}

// E2) Уравнение Бернулли: P + ½ρv² + ρgh = const (полное давление).
const bernoulli: CalcDef = {
  id: 'bernoulli',
  title: 'Уравнение Бернулли (полное давление)',
  formula: 'P + \\frac{1}{2}\\rho v^2 + \\rho g h = \\text{const}',
  fields: [
    { key: 'P', label: 'Статическое давление (P)', unit: 'Па', default: 101325 },
    { key: 'rho', label: 'Плотность (ρ)', unit: 'кг/м³', default: 1060 },
    { key: 'v', label: 'Скорость (v)', unit: 'м/с', default: 0.5 },
    { key: 'g', label: 'Ускорение свободного падения (g)', unit: 'м/с²', default: 9.81 },
    { key: 'h', label: 'Высота (h)', unit: 'м', default: 1 },
  ],
  compute: (v) => {
    const total = v.P + 0.5 * v.rho * v.v ** 2 + v.rho * v.g * v.h
    return {
      value: total,
      unit: 'Па',
      note: `Динамическое давление ½ρv² = ${formatResult(0.5 * v.rho * v.v ** 2)} Па`,
    }
  },
}

// F) Число Рейнольдса: Re = ρ v d / η, безразмерное.
const reynolds: CalcDef = {
  id: 'reynolds',
  title: 'Число Рейнольдса',
  formula: 'Re = \\frac{\\rho v d}{\\eta}',
  fields: [
    { key: 'rho', label: 'ρ — плотность', unit: 'кг/м³', default: 1060 },
    { key: 'v', label: 'v — скорость', unit: 'м/с', default: 0.5 },
    { key: 'd', label: 'd — диаметр', unit: 'м', default: 0.02 },
    { key: 'eta', label: 'η — вязкость', unit: 'Па·с', default: 0.0035 },
  ],
  compute: (v) => {
    if (v.eta === 0) {
      return { value: NaN, unit: '', note: 'Вязкость η не может быть нулём' }
    }
    const re = (v.rho * v.v * v.d) / v.eta
    if (!Number.isFinite(re)) {
      return { value: re, unit: '' }
    }
    const mode =
      re < 2000 ? 'ламинарный режим' : re > 4000 ? 'турбулентный режим' : 'переходный режим'
    return { value: re, unit: '', note: mode }
  },
}

/* ---------- Категории ---------- */

const CATEGORIES: CategoryDef[] = [
  {
    id: 'membranes',
    label: 'Мембраны',
    calcs: [nernst, ghk, fick, nernstPlanck],
  },
  {
    id: 'hydro',
    label: 'Гидродинамика',
    calcs: [poiseuille, viscosity, reynolds, bernoulli],
  },
]

/* ---------- UI ---------- */

const INPUT_CLS =
  'block w-full rounded-lg border border-slate-300 dark:border-[#1F2E24] p-2 text-sm ' +
  'bg-white dark:bg-[#121A15] text-slate-900 dark:text-emerald-50 ' +
  'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 ' +
  'transition-colors duration-200'

/** Форматирует результат: научная запись для очень больших/маленьких чисел. */
function formatResult(value: number): string {
  const abs = Math.abs(value)
  if (Number.isNaN(value)) return '—'
  if (!Number.isFinite(value)) return '∞'
  if (abs !== 0 && (abs >= 1e6 || abs < 1e-3)) {
    // 1.2346e+7 → «1.2346 · 10^7», 1.5e-9 → «1.5 · 10^-9»
    const [mantissa, exponent] = value.toExponential(4).split('e')
    return `${mantissa} · 10^${Number(exponent)}`
  }
  return value.toPrecision(6).replace(/\.?0+$/, '')
}

/** Одна карточка калькулятора: формула (KaTeX) + поля + расчёт. */
function CalcCard({ calc }: { calc: CalcDef }) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(calc.fields.map((f) => [f.key, f.default])),
  )
  const [result, setResult] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const setField = (key: string, raw: string) => {
    const parsed = Number(raw)
    setValues((prev) => ({ ...prev, [key]: Number.isNaN(parsed) ? 0 : parsed }))
  }

  const calculate = () => {
    const { value, unit, note: extra } = calc.compute(values)
    const rendered = formatResult(value)
    setResult(unit ? `${rendered} ${unit}` : rendered)
    setNote(extra ?? null)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-2">
        <IconSolver size={18} className="text-slate-600 dark:text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-emerald-200/70">
          {calc.title}
        </h3>
      </div>

      {/* Огромная формула — KaTeX через MarkdownView. */}
      <MarkdownView
        content={`$$\n${calc.formula}\n$$`}
        className="text-3xl font-bold text-center my-6 text-slate-900 dark:text-emerald-50 overflow-x-auto hide-scrollbar"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {calc.fields.map((field) => (
          <label key={field.key} className="block">
            <span className="block text-sm text-slate-600 dark:text-emerald-200/60 mb-1">
              {field.label}
              {field.unit && (
                <span className="text-slate-400 dark:text-emerald-200/40">, {field.unit}</span>
              )}
            </span>
            <input
              type="number"
              step="any"
              value={values[field.key]}
              onChange={(e) => setField(field.key, e.target.value)}
              className={INPUT_CLS}
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={calculate}
        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl px-5 py-2.5 text-sm font-semibold
                   hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-200 active:scale-95"
      >
        Рассчитать
      </button>

      {result !== null && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <p className="text-2xl font-bold text-emerald-400">{result}</p>
          {note && (
            <p className="mt-1 text-xs text-slate-500 dark:text-emerald-200/50">{note}</p>
          )}
        </div>
      )}
    </div>
  )
}

export function CalculatorTab() {
  const [category, setCategory] = useState<string>(CATEGORIES[0].id)

  const active = CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0]

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Табы категорий. */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={
              'text-sm rounded-full px-4 py-1.5 transition-colors duration-200 ' +
              (c.id === category
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                : 'bg-slate-100 dark:bg-emerald-900/30 text-slate-700 dark:text-emerald-200/70 hover:bg-slate-200 dark:hover:bg-emerald-900/50')
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {active.calcs.map((calc) => (
        <CalcCard key={calc.id} calc={calc} />
      ))}
    </div>
  )
}
