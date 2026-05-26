import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { updateSettings } from '../../services/profile'
import { Toggle } from './Toggle'
import styles from '../../pages/SettingsPage.module.css'

const persist = (patch: Parameters<typeof updateSettings>[0]) => {
  updateSettings(patch).catch(() => { /* best-effort */ })
}

export function PrivacySection() {
  const { t } = useTranslation()
  const [anonProfile, setAnonProfile]     = useState(true)
  const [onlineStatus, setOnlineStatus]   = useState(true)
  const [activityHistory, setHistory]     = useState(true)

  const items = [
    { label: t('settings.privAnon'),    sub: t('settings.privAnonSub'),    val: anonProfile,     set: setAnonProfile,  key: 'anonProfile' as const },
    { label: t('settings.privOnline'),  sub: t('settings.privOnlineSub'),  val: onlineStatus,    set: setOnlineStatus, key: 'onlineStatus' as const },
    { label: t('settings.privHistory'), sub: t('settings.privHistorySub'), val: activityHistory, set: setHistory,      key: 'activityHistory' as const },
  ]

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('settings.section_privacidad')}</h2>
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
