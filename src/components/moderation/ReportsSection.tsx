import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useModerationReports } from '../../hooks/useModerationReports'
import { updateReport } from '../../services/moderation'
import { PageState } from '../ui/PageState'
import styles from '../../pages/ModerationPage.module.css'

export function ReportsSection() {
  const { t } = useTranslation()
  const FILTER_TABS = [
    { id: 'all',       label: t('moderation.filterAll') },
    { id: 'pending',   label: t('moderation.filterPending') },
    { id: 'resolved',  label: t('moderation.filterResolved') },
    { id: 'dismissed', label: t('moderation.filterDismissed') },
  ]
  const { data: reports, setData: setReports, loading, error } = useModerationReports()
  const [filter, setFilter]     = useState('pending')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = reports.filter(r => filter === 'all' || r.status === filter)
  const pendingCount = reports.filter(r => r.status === 'pending').length

  const updateStatus = (id: string, status: 'resolved' | 'dismissed') => {
    const prev = reports.find(r => r.id === id)
    setReports(all => all.map(r => r.id === id ? { ...r, status } : r))
    setSelected(null)
    updateReport(id, status).catch(() => {
      if (prev) setReports(all => all.map(r => r.id === id ? { ...r, status: prev.status } : r))
    })
  }

  if (loading || error) {
    return <PageState loading={loading} error={error} />
  }

  return (
    <div className={styles.body}>
      <div className={styles.reportList}>
        <div className={styles.filterTabs}>
          {FILTER_TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.filterTab} ${filter === t.id ? styles.filterTabActive : ''}`}
              onClick={() => setFilter(t.id)}
            >
              {t.label}
              {t.id === 'pending' && pendingCount > 0 && (
                <span className={styles.filterBadge}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>{t('moderation.empty')}</p>
          </div>
        ) : (
          filtered.map(r => (
            <button
              key={r.id}
              className={`${styles.reportCard} ${selected === r.id ? styles.reportCardSelected : ''} ${styles[`status_${r.status}`]}`}
              onClick={() => setSelected(selected === r.id ? null : r.id)}
            >
              <div className={styles.reportTop}>
                <div className={styles.reportMeta}>
                  <span className={styles.reportReason}>{r.reason}</span>
                  <span className={styles.reportCommunity}>{r.community} · {r.time}</span>
                </div>
                <span className={`${styles.statusPill} ${styles[`pill_${r.status}`]}`}>
                  {r.status === 'pending' ? t('moderation.statusPending') : r.status === 'resolved' ? t('moderation.statusResolved') : t('moderation.statusDismissed')}
                </span>
              </div>

              <p className={styles.reportContent}>"{r.content}"</p>

              <div className={styles.reportFooter}>
                <span>{t('moderation.reportedBy')} <strong>{r.reporter}</strong></span>
                <span>{t('moderation.against')} <strong>{r.reported}</strong></span>
              </div>

              {selected === r.id && r.status === 'pending' && (
                <div className={styles.reportActions} onClick={e => e.stopPropagation()}>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnResolve}`}
                    onClick={() => updateStatus(r.id, 'resolved')}
                  >
                    {t('moderation.resolve')}
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnWarn}`}
                    onClick={() => updateStatus(r.id, 'resolved')}
                  >
                    {t('moderation.warn')}
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnDismiss}`}
                    onClick={() => updateStatus(r.id, 'dismissed')}
                  >
                    {t('moderation.dismiss')}
                  </button>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
