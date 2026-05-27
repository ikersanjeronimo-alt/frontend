import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ReportsSection }     from '../components/moderation/ReportsSection'
import { MembersSection }     from '../components/moderation/MembersSection'
import { BannedWordsSection } from '../components/moderation/BannedWordsSection'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './ModerationPage.module.css'

type Tab = 'reports' | 'members' | 'filter'

export function ModerationPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('reports')

  const TABS = useMemo<{ id: Tab; label: string }[]>(() => [
    { id: 'reports', label: t('moderation.tabReports') },
    { id: 'members', label: t('moderation.tabMembers') },
    { id: 'filter',  label: t('moderation.tabFilter') },
  ], [t])

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('moderation.title')}</h1>
          <p className={styles.subtitle}>{t('moderation.subtitle')}</p>
        </div>
        <SleepingCat
          color={catFor('/moderacion').color}
          seed={catFor('/moderacion').seed}
          size={96}
          className={styles.pageCat}
        />
      </div>

      <div className={styles.sectionNav}>
        {TABS.map(tabItem => (
          <button
            key={tabItem.id}
            className={`${styles.sectionBtn} ${tab === tabItem.id ? styles.sectionBtnActive : ''}`}
            onClick={() => setTab(tabItem.id)}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'reports' && <ReportsSection />}
      {tab === 'members' && <MembersSection />}
      {tab === 'filter'  && <BannedWordsSection />}

    </div>
  )
}
