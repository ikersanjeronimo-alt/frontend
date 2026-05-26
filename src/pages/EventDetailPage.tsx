import type { ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEvents } from '../hooks/useEvents'
import { useEventInterests } from '../hooks/useEventInterests'
import { markInterest } from '../services/events'
import { silentMutation } from '../lib/silentMutation'
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

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate    = useNavigate()
  const { isMod }   = useRole()
  const { t }       = useTranslation()

  const EXPECTATIONS: { icon: ReactNode; text: string }[] = [
    { icon: <IconShield size={18} />,   text: t('events.expectSafe') },
    { icon: <IconHand size={18} />,     text: t('events.expectVol') },
    { icon: <IconLock size={18} />,     text: t('events.expectConf') },
    { icon: <IconQuestion size={18} />, text: t('events.expectQs') },
  ]

  const { data: events, loading, error } = useEvents()
  const event = eventId ? events.find(e => e.id === eventId) : undefined
  const notFound = !loading && !error && !event

  const { toggle, isInterested } = useEventInterests()
  const liked = eventId ? isInterested(eventId) : false

  if (loading || error || notFound || !event) {
    return (
      <div className={styles.page}>
        <div className={styles.backRow}>
          <button className={styles.backBtn} onClick={() => navigate('/eventos')}>
            {t('events.backAll')}
          </button>
        </div>
        <PageState
          loading={loading}
          error={error ?? (notFound ? t('events.notFound') : null)}
        />
      </div>
    )
  }

  const handleToggleInterest = async () => {
    if (!eventId) return
    const nowInterested = toggle(eventId)
    const err = await silentMutation(markInterest(eventId, nowInterested))
    if (err) toggle(eventId)  // rollback en error de servidor
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
            <p className={styles.heroHost}>{t('common.host')} {event.host}</p>
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

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('events.topics')}</h2>
            <div className={styles.tags}>
              {event.tags.map(t => (
                <span key={t} className={styles.tag}>{t}</span>
              ))}
            </div>
          </div>

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
                  <span className={styles.infoValue}>{event.date} · {event.time}</span>
                </div>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}><IconClock size={18} /></span>
                <div>
                  <span className={styles.infoLabel}>{t('events.infoDuration')}</span>
                  <span className={styles.infoValue}>{event.duration}</span>
                </div>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}><IconUser size={18} /></span>
                <div>
                  <span className={styles.infoLabel}>{t('events.infoHost')}</span>
                  <span className={styles.infoValue}>{event.host}</span>
                </div>
              </div>
            </div>

            <button
              className={`${styles.heartBtnLarge} ${liked ? styles.heartBtnLargeActive : ''}`}
              onClick={() => { void handleToggleInterest() }}
            >
              <IconHeart filled={liked} size={18} />
              <span>{liked ? t('events.interestedYes') : t('events.interestedNo')}</span>
              <span className={styles.heartCount}>· {(event.interestedCount ?? 0) + (liked ? 1 : 0)}</span>
            </button>

          </div>
        </aside>
      </div>
    </div>
  )
}
