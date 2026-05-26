import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEvents } from '../hooks/useEvents'
import { useAuth } from '../context/AuthContext'
import { useEventInterests } from '../hooks/useEventInterests'
import { markInterest } from '../services/events'
import { PageState } from '../components/ui/PageState'
import { IconHeart } from '../components/ui/Icons'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './EventListPage.module.css'

export function EventListPage() {
  const { t } = useTranslation()
  const { data: events, loading, error } = useEvents()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toggle, isInterested } = useEventInterests()

  const isMod = user?.role === 'MODERATOR' || user?.role === 'ADMIN'

  const toggleLike = (id: string, ev: React.MouseEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    const nowInterested = toggle(id)
    // Best-effort hacia el back. En demo mode (network error) cae al banner.
    void markInterest(id, nowInterested).catch(() => { /* silent — store local ya cambió */ })
  }

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('events.title')}</h1>
          <p className={styles.subtitle}>{t('events.subtitle')}</p>
        </div>
        {isMod && (
          <button
            className={styles.createBtn}
            onClick={() => navigate('/eventos/nuevo')}
          >
            {t('events.createBtn')}
          </button>
        )}
        <SleepingCat
          color={catFor('/eventos').color}
          seed={catFor('/eventos').seed}
          size={100}
          className={styles.pageCat}
        />
      </div>

      <PageState loading={loading} error={error} empty={!loading && events.length === 0} emptyMessage={t('events.emptyMsg')} />

      <div className={styles.list}>
        {events.map((e, i) => {
          const liked = isInterested(e.id)
          const count = (e.interestedCount ?? 0) + (liked ? 1 : 0)
          return (
            <article
              key={e.id}
              className={`${styles.card} animate-fadeInUp delay-${Math.min(i + 1, 6)}`}
            >
              <Link
                to={`/eventos/${e.id}`}
                className={styles.cardLinkOverlay}
                aria-label={`Abrir evento ${e.title}`}
              />

              <button
                className={`${styles.heartBtn} ${liked ? styles.heartBtnActive : ''}`}
                onClick={ev => toggleLike(e.id, ev)}
                aria-label={liked ? t('events.liked') : t('events.notLiked')}
              >
                <IconHeart filled={liked} size={18} />
                <span className={styles.heartCount}>{count}</span>
              </button>

              <div className={styles.cardBody}>
                <div className={styles.cardTopRow}>
                  <span className={styles.cardDate}>{e.date} · {e.time}</span>
                </div>
                <h3 className={styles.cardTitle}>{e.title}</h3>
                <p className={styles.cardHost}>{t('common.host')} {e.host} · {e.duration}</p>
                <p className={styles.cardDesc}>{e.desc}</p>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
