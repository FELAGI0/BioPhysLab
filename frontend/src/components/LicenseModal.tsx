/** Модальное окно «Лицензия». */

import { Modal } from './Modal'

export function LicenseModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Лицензия" onClose={onClose}>
      <p>
        Код проекта распространяется под лицензией MIT. Вы можете свободно
        использовать его в учебных целях. Модель ИИ предоставляется сторонним
        провайдером.
      </p>
    </Modal>
  )
}
