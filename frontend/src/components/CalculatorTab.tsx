/**
 * Калькулятор: 20 биофизических формул из методички, локальный расчёт (без AI).
 * Категории: «Мембраны» (Нернст, ГХК, Фик, Нернст—Планк), «Гидродинамика»
 * (Пуазейль, Вязкость, Рейнольдс, Бернулли), «Акустика» (интенсивность,
 * звуковое давление, уровень дБ, скорости звука, Доплер),
 * «Электрический ток» (плотность тока, закон Ома, электрофорез,
 * гальванизация, переменный ток). Формулы выводятся крупно через KaTeX,
 * под каждой — краткое пояснение, зачем она нужна.
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
  /** Краткое пояснение (1-2 предложения): для чего нужна формула. */
  description: string
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
  description:
    'Равновесный потенциал иона по разности его концентраций снаружи и внутри клетки. ' +
    'Используется для расчёта потенциала покоя и оценки направления движения ионов.',
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
  description:
    'Мембранный потенциал с учётом проницаемости мембраны сразу для нескольких ионов. ' +
    'Применяется, когда нужно оценить потенциал покоя реальной клетки, а не одного иона.',
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
  description:
    'Диффузия: сколько вещества проходит через сечение за счёт градиента концентрации. ' +
    'Используется для расчёта потоков ионов и газов через мембраны.',
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
  description:
    'Объединяет диффузию и миграцию ионов в электрическом поле в один поток. ' +
    'Нужно, чтобы оценить перенос ионов при наличии и градиента концентрации, и внешнего поля.',
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
  description:
    'Связывает объёмный кровоток с радиусом сосуда, перепадом давления и вязкостью крови. ' +
    'Используется для оценки кровотока по сосуду и эффекта сужения артерий.',
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
  description:
    'Уравнение Ньютона описывает внутреннее трение между слоями жидкости. ' +
    'Используется для расчёта силы вязкости при известном градиенте скорости.',
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
  description:
    'Связывает давление, скорость и высоту в потоке жидкости. ' +
    'Применяется для расчёта полного давления в кровеносном сосуде и объяснения гидродинамических эффектов.',
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
  description:
    'Показывает, ламинарный или турбулентный режим течения. ' +
    'Нужно, чтобы понять характер кровотока при заданных скорости, диаметре сосуда и вязкости.',
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

/* ---------- Акустика (по методичке) ---------- */

// G) Интенсивность волны: I = P / S.
const intensity: CalcDef = {
  id: 'intensity',
  title: 'Интенсивность волны',
  formula: 'I = \\frac{P}{S}',
  description:
    'Мощность, приходящаяся на единицу площади. ' +
    'Используется для оценки энергии, которую звук переносит через поверхность.',
  fields: [
    { key: 'P', label: 'Мощность (P)', unit: 'Вт', default: 1e-3 },
    { key: 'S', label: 'Площадь (S)', unit: 'м²', default: 1e-4 },
  ],
  compute: (v) => {
    if (v.S === 0) {
      return { value: NaN, unit: 'Вт/м²', note: 'Площадь S не может быть нулём' }
    }
    return { value: v.P / v.S, unit: 'Вт/м²' }
  },
}

// H) Звуковое давление: p = F / S.
const soundPressure: CalcDef = {
  id: 'sound-pressure',
  title: 'Звуковое давление',
  formula: 'p = \\frac{F}{S}',
  description:
    'Сила, действующая со стороны волны на единицу площади. ' +
    'Нужно для расчёта давления, которое возникает в среде при распространении звука.',
  fields: [
    { key: 'F', label: 'Сила (F)', unit: 'Н', default: 1e-4 },
    { key: 'S', label: 'Площадь (S)', unit: 'м²', default: 1e-4 },
  ],
  compute: (v) => {
    if (v.S === 0) {
      return { value: NaN, unit: 'Па', note: 'Площадь S не может быть нулём' }
    }
    return { value: v.F / v.S, unit: 'Па' }
  },
}

// I) Уровень интенсивности звука: L = 10 lg(I/I_0), I_0 = 10⁻¹² Вт/м².
const intensityLevel: CalcDef = {
  id: 'intensity-level',
  title: 'Уровень интенсивности (дБ)',
  formula: 'L = 10 \\, \\lg \\frac{I}{I_0}, \\quad I_0 = 10^{-12} \\, \\text{Вт/м}^2',
  description:
    'Переводит абсолютную интенсивность звука в децибелы по логарифмической шкале. ' +
    'Применяется для оценки громкости относительно порога слышимости.',
  fields: [
    { key: 'I', label: 'Интенсивность (I)', unit: 'Вт/м²', default: 1e-12 },
  ],
  compute: (v) => {
    if (v.I <= 0) {
      return { value: NaN, unit: 'дБ', note: 'Интенсивность I должна быть больше нуля' }
    }
    const I0 = 1e-12
    const l = 10 * Math.log10(v.I / I0)
    return { value: l, unit: 'дБ' }
  },
}

// J) Скорость звука в газах: v = sqrt(γ R T / M).
const soundGas: CalcDef = {
  id: 'sound-gas',
  title: 'Скорость звука в газах',
  formula: 'v = \\sqrt{\\frac{\\gamma R T}{M}}',
  description:
    'Скорость звука в газе через показатель адиабаты, температуру и молярную массу. ' +
    'Используется для расчёта скорости звука в воздухе и других газовых средах.',
  fields: [
    { key: 'gamma', label: 'Показатель адиабаты (γ)', default: 1.4 },
    { key: 'T', label: 'Температура (T)', unit: 'К', default: 310.15 },
    { key: 'M', label: 'Молярная масса (M)', unit: 'кг/моль', default: 0.029 },
  ],
  compute: (v) => {
    if (v.M <= 0 || v.T <= 0) {
      return {
        value: NaN,
        unit: 'м/с',
        note: 'Молярная масса и температура должны быть больше нуля',
      }
    }
    return { value: Math.sqrt((v.gamma * R * v.T) / v.M), unit: 'м/с' }
  },
}

// K) Скорость звука в жидкостях: v = sqrt(K / ρ).
const soundLiquid: CalcDef = {
  id: 'sound-liquid',
  title: 'Скорость звука в жидкостях',
  formula: 'v = \\sqrt{\\frac{K}{\\rho}}',
  description:
    'Скорость звука в жидкости через модуль объёмной упругости и плотность. ' +
    'Применяется для расчёта скорости ультразвука в мягких тканях и воде.',
  fields: [
    { key: 'K', label: 'Модуль объёмной упругости (K)', unit: 'Па', default: 2.2e9 },
    { key: 'rho', label: 'Плотность (ρ)', unit: 'кг/м³', default: 1000 },
  ],
  compute: (v) => {
    if (v.K <= 0 || v.rho <= 0) {
      return {
        value: NaN,
        unit: 'м/с',
        note: 'Модуль упругости и плотность должны быть больше нуля',
      }
    }
    return { value: Math.sqrt(v.K / v.rho), unit: 'м/с' }
  },
}

// L) Доплеровский сдвиг: f' = f (v ± v_набл) / (v ∓ v_ист).
const doppler: CalcDef = {
  id: 'doppler',
  title: 'Доплеровский сдвиг частоты',
  formula: "f' = f \\, \\frac{v \\pm v_{\\text{набл}}}{v \\mp v_{\\text{ист}}}",
  description:
    'Изменение частоты при относительном движении источника и наблюдателя. ' +
    'Используется в ультразвуковой доплерографии для измерения скорости кровотока.',
  fields: [
    { key: 'f', label: 'Частота источника (f)', unit: 'Гц', default: 1000 },
    { key: 'v', label: 'Скорость звука (v)', unit: 'м/с', default: 340 },
    { key: 'vObs', label: 'Скорость наблюдателя (v_набл)', unit: 'м/с', default: 0 },
    { key: 'vSrc', label: 'Скорость источника (v_ист)', unit: 'м/с', default: 0 },
  ],
  compute: (v) => {
    // Соглашение о знаках: положительная скорость — сближение
    // (наблюдатель движется к источнику, источник — к наблюдателю).
    const den = v.v - v.vSrc
    if (den === 0) {
      return { value: NaN, unit: 'Гц', note: 'Скорость источника не равна скорости звука' }
    }
    if (den < 0) {
      return { value: NaN, unit: 'Гц', note: 'Источник не может двигаться быстрее звука' }
    }
    const fPrime = (v.f * (v.v + v.vObs)) / den
    return {
      value: fPrime,
      unit: 'Гц',
      note: 'Положительные скорости — сближение (частота растёт)',
    }
  },
}

/* ---------- Электрический ток (по методичке) ---------- */

// N) Плотность тока: j = I / S.
const currentDensity: CalcDef = {
  id: 'current-density',
  title: 'Плотность тока',
  formula: 'j = \\frac{I}{S}',
  description:
    'Сила тока, приходящаяся на единицу площади сечения проводника или ткани. ' +
    'Нужна для оценки воздействия тока на ткани и контроля процедур.',
  fields: [
    { key: 'I', label: 'Сила тока (I)', unit: 'А', default: 1e-3 },
    { key: 'S', label: 'Площадь (S)', unit: 'м²', default: 1e-4 },
  ],
  compute: (v) => {
    if (v.S === 0) {
      return { value: NaN, unit: 'А/м²', note: 'Площадь S не может быть нулём' }
    }
    return { value: v.I / v.S, unit: 'А/м²' }
  },
}

// O) Закон Ома: I = U / R и j = σ E.
const ohm: CalcDef = {
  id: 'ohm',
  title: 'Закон Ома для растворов',
  formula: 'I = \\frac{U}{R}, \\quad j = \\sigma E',
  description:
    'Связывает напряжение, ток и сопротивление, а также плотность тока с проводимостью. ' +
    'Применяется для расчёта тока в тканях и растворах электролитов.',
  fields: [
    { key: 'U', label: 'Напряжение (U)', unit: 'В', default: 10 },
    { key: 'R', label: 'Сопротивление (R)', unit: 'Ом', default: 1000 },
    { key: 'sigma', label: 'Удельная проводимость (σ)', unit: 'См/м', default: 1 },
    { key: 'E', label: 'Напряжённость (E)', unit: 'В/м', default: 10 },
  ],
  compute: (v) => {
    if (v.R === 0) {
      return { value: NaN, unit: 'А', note: 'Сопротивление R не может быть нулём' }
    }
    const i = v.U / v.R
    const j = v.sigma * v.E
    return {
      value: i,
      unit: 'А',
      note: `Плотность тока j = σE = ${formatResult(j)} А/м²`,
    }
  },
}

// P) Максимальная плотность тока при электрофорезе: j_max = 0,1 мА/см² (справочное значение).
const electrophoresisMax: CalcDef = {
  id: 'electrophoresis-max',
  title: 'Максимальная плотность тока при электрофорезе',
  formula: 'j_{\\max} = \\frac{I_{\\max}}{S}',
  description:
    'Проверяет, не превышена ли допустимая плотность тока при электрофорезе. ' +
    'Помогает подобрать силу тока под площадь электрода без риска для пациента.',
  fields: [
    { key: 'Imax', label: 'Макс. сила тока (I_max)', unit: 'мА', default: 50 },
    { key: 'S', label: 'Площадь электрода (S)', unit: 'см²', default: 100 },
  ],
  compute: (v) => {
    if (v.S === 0) {
      return { value: NaN, unit: 'мА/см²', note: 'Площадь S не может быть нулём' }
    }
    const jMax = v.Imax / v.S
    const limit = 0.1
    return {
      value: jMax,
      unit: 'мА/см²',
      note:
        jMax > limit
          ? `Превышена допустимая плотность тока: j_max > ${limit} мА/см² (порог болевого ощущения)`
          : `Допустимая плотность тока ≤ ${limit} мА/см² — норма`,
    }
  },
}

// Q) Максимальное напряжение при гальванизации: U_max = j_max · ρ · L.
const galvanizationMax: CalcDef = {
  id: 'galvanization-max',
  title: 'Максимальное напряжение при гальванизации',
  formula: 'U_{\\max} = j_{\\max} \\, \\rho \\, L',
  description:
    'Оценивает максимальное напряжение при гальванизации по закону Ома. ' +
    'Нужна для выбора параметров процедуры при заданном расстоянии между электродами.',
  fields: [
    { key: 'jmax', label: 'Макс. плотность тока (j_max)', unit: 'А/м²', default: 1 },
    { key: 'rho', label: 'Удельное сопротивление тканей (ρ)', unit: 'Ом·м', default: 2 },
    { key: 'L', label: 'Расстояние между электродами (L)', unit: 'м', default: 0.05 },
  ],
  compute: (v) => ({
    value: v.jmax * v.rho * v.L,
    unit: 'В',
    note: 'Оценка по закону Ома: U = j · ρ · L (ткани — однородный проводник)',
  }),
}

// R) Мгновенное значение силы тока: i = I_max · sin(ωt).
const instantaneousCurrent: CalcDef = {
  id: 'instantaneous-current',
  title: 'Мгновенное значение силы тока',
  formula: 'i = I_{\\max} \\sin(\\omega t)',
  description:
    'Даёт мгновенное значение переменного тока в выбранный момент времени. ' +
    'Используется для расчёта тока в любой фазе периода при известной амплитуде и частоте.',
  fields: [
    { key: 'Imax', label: 'Амплитуда (I_max)', unit: 'А', default: 1 },
    { key: 'omega', label: 'Угловая частота (ω)', unit: 'рад/с', default: 314.16 },
    { key: 't', label: 'Время (t)', unit: 'с', default: 0.005 },
  ],
  compute: (v) => ({
    value: v.Imax * Math.sin(v.omega * v.t),
    unit: 'А',
    note: 'ω = 2πf; при 50 Гц ω ≈ 314,16 рад/с',
  }),
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
  {
    id: 'acoustics',
    label: 'Акустика',
    calcs: [intensity, soundPressure, intensityLevel, soundGas, soundLiquid, doppler],
  },
  {
    id: 'current',
    label: 'Электрический ток',
    calcs: [currentDensity, ohm, electrophoresisMax, galvanizationMax, instantaneousCurrent],
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
        className="text-3xl font-bold text-center mt-6 mb-3 text-slate-900 dark:text-emerald-50 overflow-x-auto hide-scrollbar"
      />

      {/* Короткое пояснение: для чего нужна формула. */}
      <p className="text-sm text-slate-400 dark:text-emerald-200/50 text-center mb-4">
        {calc.description}
      </p>

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
