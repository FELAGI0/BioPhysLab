/** Модальное окно «О проекте (FAQ)». */

import { Modal } from './Modal'

const FAQ_ITEMS: { title: string; text: string }[] = [
  {
    title: 'BioPhysLab — бесплатный ИИ-помощник по биофизике',
    text: 'Без тарифов, регистрации и лимитов для учебной работы.',
  },
  {
    title: 'В основе — флагманская модель Claude Opus 5.5',
    text: 'Оптимизирована для сложных медицинских и научных рассуждений.',
  },
  {
    title: 'Модуль ЭКГ',
    text: 'Использует мультимодальные возможности модели для анализа изображений.',
  },
  {
    title: 'Модуль Задач',
    text: 'Выдаёт пошаговое решение, чтобы помочь разобраться, а не просто списать.',
  },
  {
    title: 'Все запросы анонимны',
    text: 'Мы не собираем персональные данные — только агрегированную статистику.',
  },
  {
    title: 'Авторизация',
    text: 'Позволяет сохранять историю запросов и получать доступ к ней с любого устройства. Пароли хранятся в зашифрованном виде.',
  },
  {
    title: 'Ключ API нейросети хранится только на сервере',
    text: 'Ваши запросы не содержат персональных данных.',
  },
]

export function FaqModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="О проекте BioPhysLab" onClose={onClose}>
      <ul className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <li key={item.title} className="flex gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-0.5" aria-hidden="true">
              •
            </span>
            <span>
              <strong className="text-gray-900 dark:text-white">{item.title}.</strong>{' '}
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
