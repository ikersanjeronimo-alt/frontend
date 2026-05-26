import { useTranslation } from 'react-i18next'
import { Section } from '../ui/Section'
import { Card } from '../ui/Card'
import styles from './HelpSection.module.css'

export function HelpSection() {
  const { t } = useTranslation()
  const FAQ = [
    { q: t('settings.faqQ1'), a: t('settings.faqA1') },
    { q: t('settings.faqQ2'), a: t('settings.faqA2') },
    { q: t('settings.faqQ3'), a: t('settings.faqA3') },
  ]
  return (
    <Section title={t('settings.section_ayuda')}>
      <Card>
        {FAQ.map(item => (
          <div key={item.q} className={styles.item}>
            <p className={styles.question}>{item.q}</p>
            <p className={styles.answer}>{item.a}</p>
          </div>
        ))}
      </Card>
    </Section>
  )
}
