import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNotificationsStore } from '../../store/notificationsStore'
import styles from './NotificationToast.module.css'

/**
 * Toast global para notificaciones "en vivo" (WebSocket). Se monta una vez en la
 * raíz de la app; muestra la notificación vigente del store y se auto-descarta a
 * los 8 s (o al pulsar la X). Hoy el único origen son los avisos de moderación.
 */
export function NotificationToast() {
  const { t }   = useTranslation()
  const current = useNotificationsStore(s => s.current)
  const dismiss = useNotificationsStore(s => s.dismiss)

  useEffect(() => {
    if (!current) return
    const id = window.setTimeout(dismiss, 8000)
    return () => window.clearTimeout(id)
  }, [current, dismiss])

  if (!current) return null

  const text = current.type === 'WARNING'
    ? t('notifications.warned', { count: current.warnings ?? 0 })
    : t('notifications.generic')

  return (
    <div className={styles.toast} role="alert">
      <span className={styles.text}>{text}</span>
      <button type="button" className={styles.close} onClick={dismiss} aria-label={t('common.cancel')}>
        ✕
      </button>
    </div>
  )
}
