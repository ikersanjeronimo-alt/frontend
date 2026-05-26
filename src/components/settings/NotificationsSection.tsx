import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { updateSettings } from '../../services/profile'
import { Toggle } from './Toggle'
import styles from '../../pages/SettingsPage.module.css'

const persist = (patch: Parameters<typeof updateSettings>[0]) => {
  updateSettings(patch).catch(() => { /* best-effort */ })
}

export function NotificationsSection() {
  const { t } = useTranslation()
  const [notifMessages, setNotifMessages] = useState(true)
  const [notifEvents, setNotifEvents]     = useState(true)
  const [notifEmail, setNotifEmail]       = useState(false)

  const items = [
    { label: t('settings.notifMessages'), sub: t('settings.notifMessagesSub'), val: notifMessages, set: setNotifMessages, key: 'notifMessages' as const },
    { label: t('settings.notifEvents'),   sub: t('settings.notifEventsSub'),   val: notifEvents,   set: setNotifEvents,   key: 'notifEvents' as const },
    { label: t('settings.notifEmail'),    sub: t('settings.notifEmailSub'),    val: notifEmail,    set: setNotifEmail,    key: 'notifEmail' as const },
  ]

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('settings.section_notificaciones')}</h2>
      <div className={styles.card}>
        {items.map(item => (
          <div key={item.label} className={styles.toggleRow}>
            <div>
              <p className={styles.toggleLabel}>{item.label}</p>
              <p className={styles.toggleSub}>{item.sub}</p>
            </div>
            <Toggle
              on={item.val}
              ariaLabel={item.label}
              onChange={v => { item.set(v); persist({ [item.key]: v }) }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
