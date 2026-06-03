import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRole } from '../hooks/useRole'
import { useProfessionals } from '../hooks/useProfessionals'
import { PageState } from '../components/ui/PageState'
import { IconSearch, IconDot } from '../components/ui/Icons'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './ProfessionalsPage.module.css'

type Availability = 'now' | 'today' | 'tomorrow'

function AvailabilityPill({ a, at }: { a: Availability; at?: string }) {
  const { t } = useTranslation()
  if (a === 'now') return (
    <span className={`${styles.pill} ${styles.pillNow}`}>
      <IconDot color="var(--green)" size={8} />
      <span>{t('professionals.availNow')}</span>
    </span>
  )
  if (a === 'today') return (
    <span className={`${styles.pill} ${styles.pillToday}`}>
      <IconDot color="var(--peach)" size={8} />
      <span>{at}</span>
    </span>
  )
  return <span className={`${styles.pill} ${styles.pillTomorrow}`}>{t('professionals.availTomorrow')}</span>
}

export function ProfessionalsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isMod } = useRole()
  const { data: professionals, loading, error } = useProfessionals()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const SPECIALTY_LABELS: Record<string, string> = {
    psicologo:  t('professionals.specPsi'),
    terapeuta:  t('professionals.specTer'),
    psiquiatra: t('professionals.specPsq'),
  }
  const FILTERS = [
    { id: 'all',        label: t('professionals.filterAll') },
    { id: 'psicologo',  label: t('professionals.filterPsi') },
    { id: 'terapeuta',  label: t('professionals.filterTer') },
    { id: 'psiquiatra', label: t('professionals.filterPsq') },
    { id: 'now',        label: t('professionals.filterNow') },
  ]

  const filtered = professionals.filter(p => {
    const specialtyLabel = SPECIALTY_LABELS[p.specialty] ?? p.specialty
    const matchesFilter =
      filter === 'all'   ? true :
      filter === 'now'   ? p.availability === 'now' :
      p.specialty === filter
    const q = search.toLowerCase()
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      specialtyLabel.toLowerCase().includes(q) ||
      p.tags.some(tg => tg.toLowerCase().includes(q))
    return matchesFilter && matchesSearch
  })

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t('professionals.title')}</h1>
          <p className={styles.subtitle}>{t('professionals.subtitle')}</p>
        </div>
        <SleepingCat
          color={catFor('/profesionales').color}
          seed={catFor('/profesionales').seed}
          size={100}
          className={styles.pageCat}
        />
      </div>
      {isMod && (
        <button
          type="button"
          className={styles.contactBtn}
          onClick={() => navigate('/chat/inbox')}
        >
          {t('privateChat.inboxTitle')}
        </button>
      )}

      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <IconSearch size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={t('professionals.searchPh')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`${styles.filterBtn} ${filter === f.id ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <PageState loading={loading} error={error} empty={!loading && filtered.length === 0} emptyMessage={t('professionals.emptyMsg')} />

      <div className={styles.grid}>
        {filtered.map((p, i) => (
            <div
              key={p.id}
              className={`${styles.card} animate-fadeInUp delay-${Math.min(i + 1, 6)}`}
            >
              <div className={styles.cardMain}>
                <h3 className={styles.cardName}>{p.name}</h3>
                <p className={styles.cardSpecialty}>{SPECIALTY_LABELS[p.specialty] ?? p.specialty}</p>
                {p.bio && <p className={styles.cardBio}>{p.bio}</p>}

                <div className={styles.tags}>
                  {p.tags.map(t => (
                    <span key={t} className={styles.tag}>{t}</span>
                  ))}
                </div>

              </div>

              <div className={styles.cardFooter}>
                <AvailabilityPill a={p.availability} at={p.availableAt} />
                <button
                  className={styles.contactBtn}
                  onClick={() => navigate(`/chat/${p.id}`)}
                >
                  {t('professionals.contact')}
                </button>
              </div>
            </div>
        ))}
      </div>
    </div>
  )
}
