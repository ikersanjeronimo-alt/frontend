import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setLang as setI18nLang, getLang, SUPPORTED_LANGS } from '../../lib/i18n'
import type { Lang } from '../../lib/i18n'
import styles from '../../pages/SettingsPage.module.css'

const LABEL_KEY: Record<Lang, string> = {
  es: 'langOptionEs',
  en: 'langOptionEn',
  eu: 'langOptionEu',
}

export function LanguageSection() {
  const { t } = useTranslation()
  const [lang, setLangState] = useState<Lang>(() => getLang())

  const handleChange = (l: Lang) => {
    setLangState(l)
    setI18nLang(l)
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('settings.langPickerTitle')}</h2>
      <div className={styles.card}>
        {(SUPPORTED_LANGS as readonly Lang[]).map(l => (
          <button
            key={l}
            className={`${styles.langRow} ${lang === l ? styles.langRowActive : ''}`}
            onClick={() => handleChange(l)}
          >
            <span>{t(`settings.${LABEL_KEY[l]}`)}</span>
            {lang === l && <span className={styles.langCheck}>✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
