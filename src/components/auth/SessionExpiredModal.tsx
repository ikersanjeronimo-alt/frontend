import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Feedback } from '../ui/Feedback'
import styles from './SessionExpiredModal.module.css'

interface SessionExpiredModalProps {
  /** Intenta renovar la sesión. Lanza si el backend la rechaza. */
  onStay: () => Promise<void>
  /** Cierra sesión y vuelve a identidad anónima. */
  onLeave: () => void
}

/**
 * Diálogo bloqueante que aparece cuando la sesión de un usuario LOGUEADO ha
 * caducado (401). Obliga a elegir: renovar la sesión ("Seguir conectado") o
 * cerrar sesión ("Salir"). No se puede descartar haciendo click fuera — es una
 * decisión consciente. Los usuarios anónimos no lo ven (se renuevan en silencio).
 */
export function SessionExpiredModal({ onStay, onLeave }: SessionExpiredModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleStay = async () => {
    setError('')
    setLoading(true)
    try {
      await onStay()
      // Si tiene éxito, el padre desmonta el modal; no hace falta limpiar loading.
    } catch {
      setError(t('session.error'))
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} role="presentation">
      <div
        className={styles.modal}
        role="alertdialog"
        aria-modal="true"
        aria-label={t('session.title')}
      >
        <h2 className={styles.title}>{t('session.title')}</h2>
        <p className={styles.message}>{t('session.message')}</p>

        {error && <Feedback variant="error">{error}</Feedback>}

        <div className={styles.actions}>
          <button type="button" className={styles.leaveBtn} onClick={onLeave} disabled={loading}>
            {t('session.leave')}
          </button>
          <button type="button" className={styles.stayBtn} onClick={handleStay} disabled={loading}>
            {loading ? t('session.renewing') : t('session.stay')}
          </button>
        </div>
      </div>
    </div>
  )
}
