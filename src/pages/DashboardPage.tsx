import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useCommunities } from '../hooks/useCommunities'
import { useEvents } from '../hooks/useEvents'
import { useDashboardMessages } from '../hooks/useDashboardMessages'
import { useBannedWords } from '../hooks/useBannedWords'
import { maskBannedWords } from '../lib/bannedWords'
import { submitMood } from '../services/profile'
import {
  IconMoodVeryBad,
  IconMoodBad,
  IconMoodNeutral,
  IconMoodGood,
  IconMoodVeryGood,
  IconBottle,
  IconHourglass,
  IconMap,
} from '../components/ui/Icons'

const MOOD_OPTIONS = [
  { value: 1, label: 'Muy mal' },
  { value: 2, label: 'Mal' },
  { value: 3, label: 'Regular' },
  { value: 4, label: 'Bien' },
  { value: 5, label: 'Muy bien' },
] as const
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './DashboardPage.module.css'

const dashCat = catFor('/dashboard')

function fmtDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

const MOOD_ICONS = {
  1: IconMoodVeryBad,
  2: IconMoodBad,
  3: IconMoodNeutral,
  4: IconMoodGood,
  5: IconMoodVeryGood,
} as const

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: communities } = useCommunities()
  const { data: events }      = useEvents()
  const { data: messages }    = useDashboardMessages()
  const { words: bannedWords } = useBannedWords()
  const [mood, setMood]           = useState<number | null>(null)
  const [moodError, setMoodError] = useState('')
  const [moodSending, setMoodSending] = useState(false)

  const myCommunities = communities.filter(c => c.joined)
  const nextEvent     = events[0]

  const handleMood = async (value: number) => {
    if (moodSending) return
    const previous = mood
    setMood(value)
    setMoodError('')
    setMoodSending(true)
    try {
      await submitMood(value)
    } catch (e) {
      setMood(previous)
      setMoodError(e instanceof Error ? e.message : t('dashboard.moodError'))
    } finally {
      setMoodSending(false)
    }
  }

  return (
    <div className={styles.page}>

      <section className={styles.banner}>
        <div className={styles.bannerContent}>
          <p className={styles.bannerGreeting}>{t('dashboard.greeting')}</p>
          <h1 className={styles.bannerUsername}>{user?.username ?? '...'}</h1>
          <p className={styles.bannerSub}>{t('dashboard.howAreYou')}</p>
        </div>
        <div className={`${styles.bannerBlob} blob blob-float-slow`} />
      </section>

      <section className={styles.moodSection} aria-label="Selector de estado de ánimo">
        <SleepingCat
          color={dashCat.color}
          seed={dashCat.seed}
          size={110}
          className={styles.dashCat}
        />
        <div className={styles.moodRow}>
          {MOOD_OPTIONS.map(m => {
            const Icon = MOOD_ICONS[m.value as keyof typeof MOOD_ICONS]
            return (
              <button
                key={m.value}
                className={`${styles.moodBtn} ${mood === m.value ? styles.moodBtnActive : ''}`}
                onClick={() => handleMood(m.value)}
                disabled={moodSending}
                title={m.label}
                aria-label={m.label}
              >
                <Icon size={28} className={styles.moodIcon} />
                <span className={styles.moodLabel}>{m.label}</span>
              </button>
            )
          })}
        </div>
        {mood && !moodError && <p className={styles.moodConfirm}>{t('dashboard.moodConfirm')}</p>}
        {moodError && <p className={styles.moodError} role="alert">{moodError}</p>}
      </section>

      <div className={styles.grid}>

        <div className={styles.left}>

          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <h2 className={styles.widgetTitle}>{t('dashboard.myCommunities')}</h2>
              <button className={styles.widgetLink} onClick={() => navigate('/comunidades')}>
                {t('dashboard.seeAll')}
              </button>
            </div>
            <div className={styles.communityList}>
              {myCommunities.map(c => (
                <Link
                  key={c.id}
                  to={`/comunidades/${c.id}`}
                  className={styles.communityRow}
                >
                  <div className={styles.communityInfo}>
                    <span className={styles.communityName}>{c.name}</span>
                    <span className={styles.communityOnline}>{c.online} {t('common.online')}</span>
                  </div>
                  {!!c.unread && c.unread > 0 && <div className={styles.unreadBadge}>{c.unread}</div>}
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <h2 className={styles.widgetTitle}>{t('dashboard.recentMsgs')}</h2>
            </div>
            <div className={styles.messageList}>
              {messages.length === 0 && (
                <p className={styles.emptyMsg}>{t('common.noResults')}</p>
              )}
              {messages.map(m => (
                <div key={m.id} className={styles.messageRow}>
                  <div className={styles.messageAvatar}>{m.username.slice(0, 2).toUpperCase()}</div>
                  <div className={styles.messageBody}>
                    <div className={styles.messageMeta}>
                      <span className={styles.messageUsername}>{m.username}</span>
                      <span className={styles.messageCommunity}>{m.community}</span>
                      <span className={styles.messageTime}>{m.time}</span>
                    </div>
                    <p className={styles.messageText}>{maskBannedWords(m.text, bannedWords)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className={styles.right}>

          {nextEvent && (
            <div className={`${styles.widget} ${styles.widgetEvent}`}>
              <p className={styles.eventLabel}>{t('dashboard.nextEvent')}</p>
              <h3 className={styles.eventTitle}>{nextEvent.title}</h3>
              {nextEvent.host && <p className={styles.eventMeta}>{t('common.host')} {nextEvent.host}</p>}
              <div className={styles.eventRow}>
                <span className={styles.eventDate}>{fmtDate(nextEvent.date)}{nextEvent.time ? ` · ${nextEvent.time}` : ''}</span>
              </div>
              <button className={styles.eventBtn} onClick={() => navigate(`/eventos/${nextEvent.id}`)}>
                {t('dashboard.joinEvent')}
              </button>
            </div>
          )}

          <div className={styles.widget}>
            <h2 className={styles.widgetTitle}>{t('dashboard.quickActions')}</h2>
            <div className={styles.quickGrid}>
              <button className={`${styles.quickBtn} ${styles.quickBtnPeach}`}    onClick={() => navigate('/botella')}>
                <IconBottle size={28} className={styles.quickIcon} />
                <span>{t('nav.botella')}</span>
              </button>
              <button className={`${styles.quickBtn} ${styles.quickBtnLavender}`} onClick={() => navigate('/maquina-del-tiempo')}>
                <IconHourglass size={28} className={styles.quickIcon} />
                <span>{t('nav.timeMachine')}</span>
              </button>
              <button className={`${styles.quickBtn} ${styles.quickBtnGreen}`}    onClick={() => navigate('/mapa')}>
                <IconMap size={28} className={styles.quickIcon} />
                <span>{t('nav.mapa')}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
