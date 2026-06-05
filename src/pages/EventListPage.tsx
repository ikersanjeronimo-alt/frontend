import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../hooks/useRole'
import { useEventInterests } from '../hooks/useEventInterests'
import { markInterest } from '../services/events'
import { PageState } from '../components/ui/PageState'
import { IconHeart } from '../components/ui/Icons'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './EventListPage.module.css'
import { useEventStore } from '../store/eventsStore'

function fmtDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export function EventListPage() {
  const { t } = useTranslation()
  // const { data: events, loading, error } = useEvents()

  const events = useEventStore(state => state.events)
  const { user } = useAuth()
  const { isMod } = useRole()
  const navigate = useNavigate()
  const { toggle, isInterested } = useEventInterests()
  const canLike = !!user

  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map())

  const updateActive = useCallback(() => {
    const viewportCenter = window.innerHeight / 2
    let closestId: string | null = null
    let closestDist = Infinity
    cardRefs.current.forEach((el, id) => {
      const rect = el.getBoundingClientRect()
      const dist = Math.abs((rect.top + rect.height / 2) - viewportCenter)
      if (dist < closestDist) { closestDist = dist; closestId = id }
    })
    setActiveEventId(closestId)
  }, [])

  useEffect(() => {
    let rafId: number | null = null
    const onScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => { updateActive(); rafId = null })
    }
    const initRaf = requestAnimationFrame(updateActive)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(initRaf)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [updateActive])

  // Re-evaluar cuando los eventos cargan (los refs aún no existían en el mount)
  useEffect(() => {
    if (events.length === 0) return
    const rafId = requestAnimationFrame(updateActive)
    return () => cancelAnimationFrame(rafId)
  }, [events.length, updateActive])

  const toggleLike = async (id: string, ev: React.MouseEvent) => {
    ev.preventDefault()
    ev.stopPropagation()
    const nowInterested = toggle(id)
    try {
      const saved = await markInterest(id, nowInterested)
      useEventStore.getState().updateEvent({
        ...saved,
        id: String(saved.id),
        interested: nowInterested,
      })
    } catch {
      toggle(id)
    }
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

      <PageState empty={events.length === 0} emptyMessage={t('events.emptyMsg')} />
      {/* <PageState loading={loading} error={error} empty={!loading && events.length === 0} emptyMessage={t('events.emptyMsg')} /> */}

      <div className={styles.list}>
        {events.map((e, i) => {
          const liked = isInterested(e.id)
          const count = e.interestedCount ?? 0
          const isActive = activeEventId === e.id
          return (
            <article
              key={e.id}
              ref={el => { if (el) cardRefs.current.set(e.id, el); else cardRefs.current.delete(e.id) }}
              className={`${styles.card} ${isActive ? styles.cardActive : ''} animate-fadeInUp delay-${Math.min(i + 1, 6)}`}
            >
              <Link
                to={`/eventos/${e.id}`}
                className={styles.cardLinkOverlay}
                aria-label={`Abrir evento ${e.title}`}
              />

              <button
                className={`${styles.heartBtn} ${liked ? styles.heartBtnActive : ''}`}
                onClick={ev => { void toggleLike(e.id, ev) }}
                aria-label={liked ? t('events.liked') : t('events.notLiked')}
                disabled={!canLike}
              >
                <IconHeart filled={liked} size={18} />
                <span className={styles.heartCount}>{count}</span>
              </button>

              <div className={styles.cardBody}>
                <div className={styles.cardTopRow}>
                  <span className={styles.cardDate}>{fmtDate(e.date)}{e.time ? ` · ${e.time}` : ''}</span>
                </div>
                <h3 className={styles.cardTitle}>{e.title}</h3>
                {(e.host || e.duration) && (
                  <p className={styles.cardHost}>
                    {e.host ? `${t('common.host')} ${e.host}` : ''}{e.host && e.duration ? ' · ' : ''}{e.duration ?? ''}
                  </p>
                )}
                <p className={`${styles.cardDesc} ${isActive ? styles.cardDescFull : ''}`}>{e.desc}</p>

                <div className={styles.cardExtra} aria-hidden={!isActive}>
                  <div className={styles.cardExtraInner}>
                    {(e.tags?.length != undefined && e.tags.length > 0) && (
                      <div className={styles.cardTags}>
                        {e?.tags?.map(tag => <span key={tag} className={styles.cardTag}>{tag}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
