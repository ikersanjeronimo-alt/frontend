import { useTranslation } from 'react-i18next'
import { useModerationMembers } from '../../hooks/useModerationMembers'
import { warnMember, banMember } from '../../services/moderation'
import styles from './MembersSection.module.css'

export function MembersSection() {
  const { t } = useTranslation()
  const { data: members, setData: setMembers } = useModerationMembers()

  const handleWarn = (id: string) => {
    warnMember(id)
      .then(updated => setMembers(all => all.map(m => m.id === id ? updated : m)))
      .catch(() => {})
  }

  const handleBan = (id: string) => {
    banMember(id)
      .then(updated => setMembers(all => all.map(m => m.id === id ? updated : m)))
      .catch(() => {})
  }

  return (
    <div className={styles.section}>
      <p className={styles.desc}>{t('moderation.membersDesc')}</p>
      <div className={styles.table}>
        {members.map(m => (
          <div key={m.id} className={styles.row}>
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
              {m.banned ? (
                <span className={styles.reports}>{t('moderation.banned')}</span>
              ) : (
                <>
                  <button type="button" className={styles.warnBtn} onClick={() => handleWarn(m.id)}>
                    {t('moderation.warnBtn')}
                  </button>
                  <button type="button" className={styles.banBtn} onClick={() => handleBan(m.id)}>
                    {t('moderation.banBtn')}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
