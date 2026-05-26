import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useSavedFlash } from '../../hooks/useSavedFlash'
import { Section } from '../ui/Section'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { SaveButton } from '../ui/SaveButton'
import { Feedback } from '../ui/Feedback'
import styles from './AccountSection.module.css'

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
    <Section title={t('settings.section_cuenta')}>
      <Card>
        <div className={styles.avatarRow}>
          <div className={styles.avatar}>
            {(user?.username ?? 'US').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className={styles.username}>{user?.username}</p>
            <p className={styles.role}>{roleLabel}</p>
          </div>
        </div>
      </Card>

      <Card title={t('settings.accChangeUsername')}>
        <div className={styles.inputRow}>
          <Input
            type="text"
            aria-label={t('settings.accChangeUsername')}
            value={usernameDraft}
            onChange={e => setUsernameDraft(e.target.value)}
            maxLength={32}
            placeholder={t('settings.accUsernamePh')}
          />
          <SaveButton onClick={handleSave} saved={saved} />
        </div>
        {usernameError && <Feedback variant="error">{usernameError}</Feedback>}
        <p className={styles.hint}>{t('settings.accUsernameHint')}</p>
      </Card>
    </Section>
  )
}
