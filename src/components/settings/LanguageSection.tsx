import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setLang as setI18nLang, getLang, SUPPORTED_LANGS } from '../../lib/i18n'
import type { Lang } from '../../lib/i18n'
import { Section } from '../ui/Section'
import { Card } from '../ui/Card'
import styles from './LanguageSection.module.css'

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
    <Section title={t('settings.langPickerTitle')}>
      <Card>
        {(SUPPORTED_LANGS as readonly Lang[]).map(l => (
          <button
            key={l}
            type="button"
            className={`${styles.row} ${lang === l ? styles.rowActive : ''}`}
            onClick={() => handleChange(l)}
          >
            <span>{t(`settings.${LABEL_KEY[l]}`)}</span>
            {lang === l && <span className={styles.check}>✓</span>}
          </button>
        ))}
      </Card>
    </Section>
  )
}
