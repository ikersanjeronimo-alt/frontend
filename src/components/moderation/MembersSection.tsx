import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useModerationMembers } from '../../hooks/useModerationMembers'
import { useModerationStaff } from '../../hooks/useModerationStaff'
import { useRole } from '../../hooks/useRole'
import { warnMember, banMember, deleteStaff } from '../../services/moderation'
import { initials } from '../../lib/initials'
import { IconDot, IconPencil, IconTrash } from '../ui/Icons'
import { StaffEditModal } from './StaffEditModal'
import type { ApiStaffMember } from '../../types/api'
import styles from './MembersSection.module.css'

export function MembersSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAdmin } = useRole()
  const { data: members, setData: setMembers } = useModerationMembers()
  const { data: staff, setData: setStaff } = useModerationStaff()

  const [editing, setEditing]       = useState<ApiStaffMember | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

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

  const handleDelete = (id: string) => {
    deleteStaff(id)
      .then(() => {
        setStaff(all => all.filter(s => s.id !== id))
        setConfirming(null)
      })
      .catch(() => setConfirming(null))
  }

  const handleSaved = (updated: ApiStaffMember) =>
    setStaff(all => all.map(s => s.id === updated.id ? updated : s))

  const roleLabel = (role: string) =>
    role === 'ADMINISTRATOR' ? t('common.administrator') : t('common.moderator')

  return (
    <div className={styles.section}>

      {/* Equipo de moderación: moderadores y administradores */}
      <div className={styles.staffHeader}>
        <p className={styles.desc}>{t('moderation.staffDesc')}</p>
        {isAdmin && (
          <button type="button" className={styles.addBtn} onClick={() => navigate('/modregister')}>
            {t('moderation.addStaff')}
          </button>
        )}
      </div>

      <div className={styles.table}>
        {staff.length === 0 ? (
          <p className={styles.empty}>{t('moderation.staffEmpty')}</p>
        ) : (
          staff.map(s => {
            const isSelf = !!user && user.id === s.id
            return (
              <div key={s.id} className={styles.row}>
                <div className={styles.avatar}>{initials(s.name || s.username)}</div>
                <div className={styles.info}>
                  <span className={styles.username}>{s.name || s.username}</span>
                  <span className={styles.meta}>
                    @{s.username}{s.email ? ` · ${s.email}` : ''}
                  </span>
                </div>

                <span className={`${styles.status} ${s.online ? styles.statusOn : styles.statusOff}`}>
                  <IconDot color="currentColor" size={8} />
                  {s.online ? t('moderation.online') : t('moderation.offline')}
                </span>

                <span className={`${styles.roleTag} ${s.role === 'ADMINISTRATOR' ? styles.roleAdmin : styles.roleMod}`}>
                  {roleLabel(s.role)}
                </span>

                {isAdmin && !isSelf && (
                  <div className={styles.actions}>
                    {confirming === s.id ? (
                      <>
                        <span className={styles.confirmText}>{t('moderation.deleteConfirm')}</span>
                        <button type="button" className={styles.banBtn} onClick={() => handleDelete(s.id)}>
                          {t('moderation.confirm')}
                        </button>
                        <button type="button" className={styles.warnBtn} onClick={() => setConfirming(null)}>
                          {t('moderation.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => setEditing(s)}
                          aria-label={t('moderation.editBtn')}
                          title={t('moderation.editBtn')}
                        >
                          <IconPencil size={16} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          onClick={() => setConfirming(s.id)}
                          aria-label={t('moderation.deleteBtn')}
                          title={t('moderation.deleteBtn')}
                        >
                          <IconTrash size={16} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Miembros de comunidades */}
      <p className={`${styles.desc} ${styles.membersTitle}`}>{t('moderation.membersDesc')}</p>
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

      {editing && (
        <StaffEditModal
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
