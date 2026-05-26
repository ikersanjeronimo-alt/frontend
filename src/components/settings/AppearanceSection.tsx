import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getInitialTheme, setTheme } from '../../lib/theme'
import { Toggle } from './Toggle'
import styles from '../../pages/SettingsPage.module.css'

export function AppearanceSection() {
  const { t } = useTranslation()
  const [darkMode, setDarkMode] = useState(() => getInitialTheme() === 'dark')

  const handleToggle = (on: boolean) => {
    setDarkMode(on)
    setTheme(on ? 'dark' : 'light')
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('settings.section_apariencia')}</h2>
      <div className={styles.card}>
        <div className={styles.toggleRow}>
          <div>
            <p className={styles.toggleLabel}>{t('settings.darkMode')}</p>
            <p className={styles.toggleSub}>{t('settings.darkModeSub')}</p>
          </div>
          <Toggle on={darkMode} ariaLabel={t('settings.darkMode')} onChange={handleToggle} />
        </div>
      </div>
    </div>
  )
}
