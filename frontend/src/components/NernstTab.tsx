/**
 * ЭКСПЕРИМЕНТ: Калькулятор потенциала Нернста.
 * Считает E = (RT/zF)·ln(C_out/C_in) локально, без запроса к AI.
 * Формула: при 37°C — 61.5/z · lg(C_out/C_in) мВ.
 */

import { useMemo, useState } from 'react'
import { IconSolver } from './icons'

const R = 8.314 // Дж/(моль·К)
const F = 96485 // Кл/моль

const IONS = [
  { label: 'K⁺ (калий)', z: 1, out: 4, in: 140, unit: 'ммоль/л' },
  { label: 'Na⁺ (натрий)', z: 1, out: 145, in: 12, unit: 'ммоль/л' },
  { label: 'Cl⁻ (хлор)', z: -1, out: 110, in: 4, unit: 'ммоль/л' },
  { label: 'Ca²⁺ (кальций)', z: 2, out: 2, in: 0.0001, unit: 'ммоль/л' },
]

export function NernstTab() {
  const [ionIndex, setIonIndex] = useState(0)
  const [cOut, setCOut] = useState(IONS[0].out)
  const [cIn, setCIn] = useState(IONS[0].in)
  const [temperature, setTemperature] = useState(310.15) // 37°C

  const ion = IONS[ionIndex]

  const { eMv, lnTerm, factor } = useMemo(() => {
    const safeOut = Math.max(cOut, 1e-12)
    const safeIn = Math.max(cIn, 1e-12)
    const ratio = safeOut / safeIn
    const ln = Math.log(ratio)
    const v = (R * temperature) / (ion.z * F)
    const e = v * ln // вольты
    return { eMv: e * 1000, lnTerm: ln, factor: (v * 1000) }
  }, [cOut, cIn, temperature, ion.z])

  const selectIon = (idx: number) => {
    setIonIndex(idx)
    setCOut(IONS[idx].out)
    setCIn(IONS[idx].in)
  }

  const inputCls =
    'block w-full rounded-lg border border-slate-300 dark:border-[#1F2E24] p-2 text-sm ' +
    'bg-white dark:bg-[#121A15] text-slate-900 dark:text-emerald-50 ' +
    'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-colors duration-200'

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-[#16201A] border border-slate-200 dark:border-[#1F2E24] rounded-xl p-6 space-y-5 transition-colors duration-200">
        <div className="flex items-center gap-2">
          <IconSolver size={18} className="text-slate-600 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-emerald-200/70">
            Калькулятор потенциала Нернста
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {IONS.map((i, idx) => (
            <button
              key={i.label}
              type="button"
              onClick={() => selectIon(idx)}
              className={
                'text-sm rounded-full px-3 py-1 transition-colors duration-200 ' +
                (idx === ionIndex
                  ? 'bg-emerald-600 dark:bg-emerald-500 dark:text-black text-white'
                  : 'bg-slate-100 dark:bg-emerald-900/30 text-slate-700 dark:text-emerald-200/70 hover:bg-slate-200 dark:hover:bg-emerald-900/50')
              }
            >
              {i.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm text-slate-600 dark:text-emerald-200/60 mb-1">
              Снаружи, {ion.unit}
            </span>
            <input
              type="number"
              value={cOut}
              step="any"
              min="0"
              onChange={(e) => setCOut(Number(e.target.value) || 0)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="block text-sm text-slate-600 dark:text-emerald-200/60 mb-1">
              Внутри, {ion.unit}
            </span>
            <input
              type="number"
              value={cIn}
              step="any"
              min="0"
              onChange={(e) => setCIn(Number(e.target.value) || 0)}
              className={inputCls}
            />
          </label>
        </div>

        <label className="block">
          <span className="block text-sm text-slate-600 dark:text-emerald-200/60 mb-1">
            Температура: {(temperature - 273.15).toFixed(1)} °C
          </span>
          <input
            type="range"
            min="273.15"
            max="313.15"
            step="0.5"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-full accent-emerald-600 dark:accent-emerald-400"
          />
        </label>

        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <p className="text-xs text-slate-500 dark:text-emerald-200/50">
            E = (RT/zF) · ln(C
            <sub>нар</sub>/C<sub>вн</sub>) = {factor.toFixed(2)} мВ ×{' '}
            {lnTerm.toFixed(3)}
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {eMv >= 0 ? '+' : ''}
            {eMv.toFixed(1)} мВ
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-emerald-200/50">
            Равновесный потенциал для {ion.label}. Учебный расчёт — сверяйте
            с учебником.
          </p>
        </div>
      </div>
    </div>
  )
}
