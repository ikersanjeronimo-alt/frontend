import { useTranslation } from 'react-i18next'
import { useModerationMembers } from '../../hooks/useModerationMembers'
import styles from '../../pages/ModerationPage.module.css'

export function MembersSection() {
  const { t } = useTranslation()
  const { data: members } = useModerationMembers()

  return (
    <div className={styles.membersSection}>
      <p className={styles.sectionDesc}>{t('moderation.membersDesc')}</p>
      <div className={styles.memberTable}>
        {members.map(m => (
          <div key={m.username} className={styles.memberRow}>
            <div className={styles.memberAvatar}>{m.username.slice(0, 2).toUpperCase()}</div>
            <div className={styles.memberInfo}>
              <span className={styles.memberUsername}>{m.username}</span>
              <span className={styles.memberMeta}>{m.community} · {t('moderation.memberJoined')} {m.joined}</span>
            </div>
            {m.reports > 0 && (
              <span className={styles.memberReports}>
                {m.reports} {m.reports > 1 ? t('moderation.memberReportPl') : t('moderation.memberReportSg')}
              </span>
            )}
            <div className={styles.memberActions}>
              <button className={styles.warnBtn}>{t('moderation.warnBtn')}</button>
              <button className={styles.banBtn}>{t('moderation.banBtn')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
