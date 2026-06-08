import { type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useEventInterests } from '../hooks/useEventInterests'
import { markInterest } from '../services/events'
import { PageState } from '../components/ui/PageState'
import { EventFormSection } from '../components/events/EventFormSection'
import { useRole } from '../hooks/useRole'
import {
  IconShield, IconHand, IconLock, IconQuestion,
  IconCalendar, IconClock, IconUser, IconHeart,
} from '../components/ui/Icons'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './EventDetailPage.module.css'
import { useEventStore } from '../store/eventsStore'

function fmtDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const { isMod }   = useRole()
  const { t }       = useTranslation()

  const EXPECTATIONS: { icon: ReactNode; text: string }[] = [
    { icon: <IconShield size={18} />,   text: t('events.expectSafe') },
    { icon: <IconHand size={18} />,     text: t('events.expectVol') },
    { icon: <IconLock size={18} />,     text: t('events.expectConf') },
    { icon: <IconQuestion size={18} />, text: t('events.expectQs') },
  ]

  const events = useEventStore(state => state.events)
  const event = eventId ? events.find(e => e.id === eventId) : undefined
  const notFound = !event

  const { toggle, isInterested } = useEventInterests()
  const liked = eventId ? isInterested(eventId) : false
  const canLike = !!user

  if (!event) {
    return (
      <div className={styles.page}>
        <div className={styles.backRow}>
          <button className={styles.backBtn} onClick={() => navigate('/eventos')}>
            {t('events.backAll')}
          </button>
        </div>
        <PageState error={notFound ? t('events.notFound') : undefined} />
      </div>
    )
  }

  const handleToggleInterest = async () => {
    if (!eventId) return
    const nowInterested = toggle(eventId)
    try {
      const saved = await markInterest(eventId, nowInterested)
      useEventStore.getState().updateEvent({
        ...saved,
        id: String(saved.id),
        interested: nowInterested,
      })
    } catch {
      toggle(eventId)
    }
  }

  return (
    <div className={styles.page}>

      <div className={styles.backRow}>
        <button className={styles.backBtn} onClick={() => navigate('/eventos')}>
          {t('events.backAll')}
        </button>
      </div>

      <div className={styles.inner}>

        <div className={styles.main}>

          <div className={styles.hero}>
            <div className={`${styles.heroBlob} blob blob-float-slow`} />
            <h1 className={styles.heroTitle}>{event.title}</h1>
            {event.host && <p className={styles.heroHost}>{t('common.host')} {event.host}</p>}
            <SleepingCat
              color={catFor('/eventos-detail').color}
              seed={catFor('/eventos-detail').seed}
              size={92}
              className={styles.eventCat}
            />
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('events.about')}</h2>
            <p className={styles.desc}>{event.desc}</p>
            <p className={styles.desc}>{t('events.aboutDesc')}</p>

            <EventFormSection isMod={isMod} />
          </div>

          {event.tags && event.tags.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('events.topics')}</h2>
            <div className={styles.tags}>
              {event.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('events.whatExpect')}</h2>
            <div className={styles.expectList}>
              {EXPECTATIONS.map(item => (
                <div key={item.text} className={styles.expectItem}>
                  <span className={styles.expectIcon}>{item.icon}</span>
                  <span className={styles.expectText}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>

            <div className={styles.infoRows}>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}><IconCalendar size={18} /></span>
                <div>
                  <span className={styles.infoLabel}>{t('events.infoDate')}</span>
                  <span className={styles.infoValue}>{fmtDate(event.date)}{event.time ? ` · ${event.time}` : ''}</span>
                </div>
              </div>
              {event.duration && (
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}><IconClock size={18} /></span>
                <div>
                  <span className={styles.infoLabel}>{t('events.infoDuration')}</span>
                  <span className={styles.infoValue}>{event.duration}</span>
                </div>
              </div>
              )}
              {event.host && (
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}><IconUser size={18} /></span>
                <div>
                  <span className={styles.infoLabel}>{t('events.infoHost')}</span>
                  <span className={styles.infoValue}>{event.host}</span>
                </div>
              </div>
              )}
            </div>

            <button
              className={`${styles.heartBtnLarge} ${liked ? styles.heartBtnLargeActive : ''}`}
              onClick={() => { void handleToggleInterest() }}
              disabled={!canLike}
            >
              <IconHeart filled={liked} size={18} />
              <span>{liked ? t('events.interestedYes') : t('events.interestedNo')}</span>
              <span className={styles.heartCount}>· {event.interestedCount ?? 0}</span>
            </button>

          </div>
        </aside>
      </div>
    </div>
  )
}
