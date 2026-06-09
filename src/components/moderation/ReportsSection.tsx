import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useModerationReports } from '../../hooks/useModerationReports'
import { onNewReport } from '../../services/reportsWS'
import { updateReport, type ReportAction } from '../../services/moderation'
import type { ApiReport } from '../../types/api'
import { PageState } from '../ui/PageState'
import { Feedback } from '../ui/Feedback'
import styles from './ReportsSection.module.css'

export function ReportsSection() {
  const { t } = useTranslation()
  const FILTER_TABS = [
    { id: 'all',       label: t('moderation.filterAll') },
    { id: 'pending',   label: t('moderation.filterPending') },
    { id: 'resolved',  label: t('moderation.filterResolved') },
    { id: 'dismissed', label: t('moderation.filterDismissed') },
  ]
  const [reloadKey, setReloadKey] = useState(0)
  const { data: reports, setData: setReports, loading, error } = useModerationReports(reloadKey)
  const [filter, setFilter]     = useState('pending')
  const [selected, setSelected] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  // Reportes en tiempo real: al llegar el aviso WS de reporte nuevo, recarga la lista.
  useEffect(() => onNewReport(() => setReloadKey(k => k + 1)), [])

  const filtered = reports.filter(r => filter === 'all' || r.status === filter)
  const pendingCount = reports.filter(r => r.status === 'pending').length

  const applyAction = (id: string, action: ReportAction) => {
    setActionError('')
    const prev = reports.find(r => r.id === id)
    const newStatus: ApiReport['status'] = action === 'dismiss' ? 'dismissed' : 'resolved'
    setReports(all => all.map(r => r.id === id ? { ...r, status: newStatus } : r))
    setSelected(null)
    updateReport(id, action).catch(() => {
      // Rollback al estado previo Y feedback visible (antes el fallo era silencioso:
      // el reporte se revertía a "pendiente" sin explicar por qué).
      if (prev) setReports(all => all.map(r => r.id === id ? { ...r, status: prev.status } : r))
      setActionError(t('moderation.actionErr'))
    })
  }

  if (loading || error) {
    return <PageState loading={loading} error={error} />
  }

  return (
    <div className={styles.body}>
      {actionError && <Feedback variant="error">{actionError}</Feedback>}
      <div className={styles.reportList}>
        <div className={styles.filterTabs}>
          {FILTER_TABS.map(tab => (
            <button
              type="button"
              key={tab.id}
              className={`${styles.filterTab} ${filter === tab.id ? styles.filterTabActive : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
              {tab.id === 'pending' && pendingCount > 0 && (
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
              type="button"
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
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnResolve}`}
                    onClick={() => applyAction(r.id, 'resolve')}
                  >
                    {t('moderation.resolve')}
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnWarn}`}
                    onClick={() => applyAction(r.id, 'warn')}
                  >
                    {t('moderation.warn')}
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnDismiss}`}
                    onClick={() => applyAction(r.id, 'dismiss')}
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
