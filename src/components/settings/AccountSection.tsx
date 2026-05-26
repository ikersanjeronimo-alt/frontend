import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useSavedFlash } from '../../hooks/useSavedFlash'
import styles from '../../pages/SettingsPage.module.css'

export function AccountSection() {
  const { user, updateUsername } = useAuth()
  const { t } = useTranslation()
  const [usernameDraft, setUsernameDraft] = useState(user?.username ?? '')
  const [usernameError, setUsernameError] = useState('')
  const [saved, flash] = useSavedFlash()

  const handleSave = async () => {
    const val = usernameDraft.trim()
    if (!val || val === user?.username) return
    setUsernameError('')
    try {
      await updateUsername(val)
      flash()
    } catch (e) {
      setUsernameError(e instanceof Error ? e.message : t('settings.accUsernameError'))
    }
  }

  const roleLabel =
    user?.role === 'ANON'       ? t('common.anon') :
    user?.role === 'USER'       ? t('common.registered') :
    user?.role === 'MODERATOR'  ? t('common.moderator') :
    user?.role === 'ADMIN'      ? t('common.administrator') :
    (user?.role ?? '')

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('settings.section_cuenta')}</h2>

      <div className={styles.card}>
        <div className={styles.avatarRow}>
          <div className={styles.avatar}>
            {(user?.username ?? 'US').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className={styles.avatarUsername}>{user?.username}</p>
            <p className={styles.avatarRole}>{roleLabel}</p>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{t('settings.accChangeUsername')}</h3>
        <div className={styles.inputRow}>
          <input
            type="text"
            aria-label={t('settings.accChangeUsername')}
            className={styles.input}
            value={usernameDraft}
            onChange={e => setUsernameDraft(e.target.value)}
            maxLength={32}
            placeholder={t('settings.accUsernamePh')}
          />
          <button className={styles.saveBtn} onClick={handleSave}>
            {saved ? t('common.saved') : t('common.save')}
          </button>
        </div>
        {usernameError && (
          <p className={styles.fieldError} role="alert">{usernameError}</p>
        )}
        <p className={styles.inputHint}>{t('settings.accUsernameHint')}</p>
      </div>
    </div>
  )
}
