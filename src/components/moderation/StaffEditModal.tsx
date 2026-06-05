import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { updateStaff } from '../../services/moderation'
import type { ApiStaffMember } from '../../types/api'
import type { ApiError } from '../../services/api'
import { FormField } from '../ui/FormField'
import { Input } from '../ui/Input'
import { Feedback } from '../ui/Feedback'
import styles from './StaffEditModal.module.css'

interface StaffEditModalProps {
  member: ApiStaffMember
  onClose: () => void
  onSaved: (updated: ApiStaffMember) => void
}

export function StaffEditModal({ member, onClose, onSaved }: StaffEditModalProps) {
  const { t } = useTranslation()
  const isAdmin = member.role === 'ADMINISTRATOR'

  const [name, setName]               = useState(member.name ?? '')
  const [email, setEmail]             = useState(member.email ?? '')
  const [company, setCompany]         = useState(member.company ?? '')
  const [profession, setProfession]   = useState(member.profession ?? '')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim()) {
      setError(t('moderation.staffEditErrFields'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError(t('moderation.staffEditErrEmail'))
      return
    }
    setLoading(true)
    try {
      const updated = await updateStaff(member.id, {
        name: name.trim(),
        email: email.trim(),
        ...(isAdmin ? {} : { company: company.trim(), profession: profession.trim() }),
      })
      onSaved(updated)
      onClose()
    } catch (err) {
      setError((err as ApiError).message || t('moderation.staffEditErr'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('moderation.staffEditTitle')}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{t('moderation.staffEditTitle')}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t('moderation.staffEditCancel')}>
            ✕
          </button>
        </div>

        <p className={styles.who}>@{member.username}</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <FormField label={t('modRegister.nameLbl')}>
            <Input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={64} autoFocus />
          </FormField>

          <FormField label={t('modRegister.emailLbl')}>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={128} />
          </FormField>

          {!isAdmin && (
            <>
              <FormField label={t('modRegister.companyLbl')}>
                <Input type="text" value={company} onChange={e => setCompany(e.target.value)} maxLength={128} />
              </FormField>

              <FormField label={t('modRegister.professionLbl')}>
                <Input type="text" value={profession} onChange={e => setProfession(e.target.value)} maxLength={64} />
              </FormField>
            </>
          )}

          {error && <Feedback variant="error">{error}</Feedback>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {t('moderation.staffEditCancel')}
            </button>
            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? t('moderation.staffEditSaving') : t('moderation.staffEditSave')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
