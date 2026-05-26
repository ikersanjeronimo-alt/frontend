import { useTranslation } from 'react-i18next'
import styles from '../../pages/SettingsPage.module.css'

export function HelpSection() {
  const { t } = useTranslation()
  const FAQ = [
    { q: t('settings.faqQ1'), a: t('settings.faqA1') },
    { q: t('settings.faqQ2'), a: t('settings.faqA2') },
    { q: t('settings.faqQ3'), a: t('settings.faqA3') },
  ]
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('settings.section_ayuda')}</h2>
      <div className={styles.card}>
        {FAQ.map(item => (
          <div key={item.q} className={styles.faqItem}>
            <p className={styles.faqQ}>{item.q}</p>
            <p className={styles.faqA}>{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
