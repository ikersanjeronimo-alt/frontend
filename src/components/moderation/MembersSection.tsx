import { useTranslation } from 'react-i18next'
import { useModerationMembers } from '../../hooks/useModerationMembers'
import styles from './MembersSection.module.css'

export function MembersSection() {
  const { t } = useTranslation()
  const { data: members } = useModerationMembers()

  return (
    <div className={styles.section}>
      <p className={styles.desc}>{t('moderation.membersDesc')}</p>
      <div className={styles.table}>
        {members.map(m => (
          <div key={m.username} className={styles.row}>
            <div className={styles.avatar}>{m.username.slice(0, 2).toUpperCase()}</div>
            <div className={styles.info}>
              <span className={styles.username}>{m.username}</span>
              <span className={styles.meta}>{m.community} · {t('moderation.memberJoined')} {m.joined}</span>
            </div>
            {m.reports > 0 && (
              <span className={styles.reports}>
                {m.reports} {m.reports > 1 ? t('moderation.memberReportPl') : t('moderation.memberReportSg')}
              </span>
            )}
            <div className={styles.actions}>
              <button type="button" className={styles.warnBtn}>{t('moderation.warnBtn')}</button>
              <button type="button" className={styles.banBtn}>{t('moderation.banBtn')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
