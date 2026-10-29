import { IconEcg, IconSolver, IconExplain, IconHistory, IconStats } from './icons'

export function PresentationPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-20">
        
        {/* Hero */}
        <div className="text-center mb-20 animate-fadeIn">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-emerald-600 dark:from-white dark:to-emerald-400 bg-clip-text text-transparent">
            BioPhysLab
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto">
            Твой ИИ-помощник по биофизике. Анализ ЭКГ, решение задач и объяснение явлений — всё в одном месте.
          </p>
          <a href="/" className="inline-block px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all hover:scale-105">
            Попробовать
          </a>
          
          <div className="mt-12 text-sm text-slate-500 dark:text-slate-500">
            Проект выполнен студентами 1 курса ВГМУ им. Н.Н. Бурденко:<br/>
            Морозова Анастасия Сергеевна, Беликова Екатерина Сергеевна (группа Л-106)
          </div>
        </div>

        {/* Как это работает */}
        <div className="mb-20 animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <h2 className="text-3xl font-bold text-center mb-12">Как это работает</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <IconEcg />, title: 'Загрузите ЭКГ', desc: 'ИИ разберёт снимок и объяснит каждый вывод.' },
              { icon: <IconSolver />, title: 'Напишите задачу', desc: 'Получите пошаговое решение с формулами.' },
              { icon: <IconExplain />, title: 'Получите объяснение', desc: 'Сложные явления — простым языком.' },
            ].map((step, i) => (
              <div key={i} className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Возможности */}
        <div className="mb-20 animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <h2 className="text-3xl font-bold text-center mb-12">Что умеет BioPhysLab</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <IconEcg />, title: 'Разбор ЭКГ', desc: 'Мультимодальный ИИ читает кардиограммы.' },
              { icon: <IconSolver />, title: 'Пошаговые решения', desc: 'Формулы, расчёты и проверка размерности.' },
              { icon: <IconStats />, title: 'Калькулятор Нернста', desc: 'Мгновенный расчёт потенциала.' },
              { icon: <IconHistory />, title: 'История и PDF', desc: 'Сохраняйте и делитесь результатами.' },
              { icon: <IconExplain />, title: 'Безопасность', desc: 'Отвечает только на медицинские вопросы.' },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="text-emerald-500 mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Финальный CTA */}
        <div className="text-center py-20 border-t border-slate-200 dark:border-slate-800 animate-fadeIn" style={{ animationDelay: '300ms' }}>
          <h2 className="text-4xl font-bold mb-6">Готовы попробовать?</h2>
          <a href="/" className="inline-block px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg rounded-xl hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all hover:scale-105">
            Заходите, попробуйте!
          </a>
        </div>

      </div>
    </div>
  )
}