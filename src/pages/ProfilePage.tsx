import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { getRoleLabel } from '../lib/roles'
import { PageState } from '../components/ui/PageState'
import { IconChat, IconCalendar, IconUsers, IconBottle, IconMap } from '../components/ui/Icons'
import { SleepingCat } from '../components/ui/SleepingCat'
import { catFor } from '../components/ui/catPalette'
import styles from './ProfilePage.module.css'

const ACTIVITY_ICON: Record<string, ReactNode> = {
  message:   <IconChat size={16} />,
  event:     <IconCalendar size={16} />,
  community: <IconUsers size={16} />,
  bottle:    <IconBottle size={16} />,
  story:     <IconMap size={16} />,
}

export function ProfilePage() {
  const { user } = useAuth()
  const { data: profile, loading, error } = useProfile()
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (loading || error) {
    return (
      <div className={styles.page}>
        <PageState loading={loading} error={error} />
      </div>
    )
  }

  const initials = (user?.username ?? 'US').slice(0, 2).toUpperCase()

  const joinedAt = new Date(profile.joinedAt)
  const joinStr  = joinedAt.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  const weeksActive = Math.max(1, Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24 * 7)))

  const stats = [
    { value: profile.stats.messages,     label: t('profile.statMessages') },
    { value: profile.stats.events,       label: t('profile.statEvents') },
    { value: profile.stats.communities,  label: t('profile.statCommunities') },
    { value: weeksActive,                label: t('profile.statWeeks') },
  ]

  return (
    <div className={styles.page}>

      <div className={styles.banner}>
        <div className={`${styles.bannerBlob} blob blob-float-slow`} />
        <div className={styles.avatarWrapper}>
          <div className={styles.avatar}>{initials}</div>
        </div>
        <SleepingCat
          color={catFor('/perfil').color}
          seed={catFor('/perfil').seed}
          size={100}
          className={styles.profileCat}
        />
      </div>

      <div className={styles.main}>
        <div className={styles.usernameRow}>
          <div className={styles.usernameDisplay}>
            <h1 className={styles.username}>{user?.username}</h1>
            {/* La edición vive solo en /configuracion > Cuenta. Aquí es solo
                un atajo — la fuente única evita triplicar UI y race conditions. */}
            <button className={styles.editUsernameBtn} onClick={() => navigate('/configuracion')}>
              {t('profile.editUsername')}
            </button>
          </div>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.metaBadge}>{getRoleLabel(user?.role, t)}</span>
          <span className={styles.metaDate}>{t('profile.memberSince')} {joinStr}</span>
        </div>

        <div className={styles.statsRow}>
          {stats.map(s => (
            <div key={s.label} className={styles.statBox}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.grid}>

          <div className={styles.widget}>
            <h2 className={styles.widgetTitle}>{t('profile.recentAct')}</h2>
            <div className={styles.timeline}>
              {profile.activity.length === 0 && (
                <p className={styles.emptyActivity}>{t('profile.noActivity')}</p>
              )}
              {profile.activity.map(a => (
                <div key={a.id} className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>{ACTIVITY_ICON[a.icon] ?? <IconChat size={16} />}</div>
                  <div className={styles.timelineBody}>
                    <p className={styles.timelineText}>{a.text}</p>
                    <span className={styles.timelineTime}>{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.widget}>
            <div className={styles.widgetHeader}>
              <h2 className={styles.widgetTitle}>{t('profile.topics')}</h2>
              <button className={styles.widgetLink} onClick={() => navigate('/configuracion')}>
                {t('profile.editTopics')}
              </button>
            </div>
            <div className={styles.prefList}>
              {profile.topics.length === 0 ? (
                <div className={styles.prefRow}>
                  <span className={styles.prefLabel}>{t('profile.noTopics')}</span>
                  <span className={styles.prefValue}>—</span>
                </div>
              ) : (
                profile.topics.map(tp => (
                  <div key={tp} className={styles.prefRow}>
                    <span className={`${styles.prefLabel} ${styles.prefLabelCap}`}>{tp}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
